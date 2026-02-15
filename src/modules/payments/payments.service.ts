// src/modules/payments/payments.service.ts
import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { InitializePaymentDto, RefundPaymentDto } from './dto/payment.dto';
import { StripeProvider } from './providers/stripe.provider';
import { PaystackProvider } from './providers/paystack.provider';
import { BookingsService } from '../bookings/bookings.service';
import {
    PaymentStatus,
    PaymentProvider,
    PAYSTACK_CURRENCIES,
} from '../../common/constants/roles.constant';
import { generateReference } from '../../common/utils/crypto.util';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
        private stripeProvider: StripeProvider,
        private paystackProvider: PaystackProvider,
        private bookingsService: BookingsService,
    ) { }

    /**
     * Determine which payment provider to use based on currency.
     * Paystack for African currencies, Stripe for everything else.
     */
    private selectProvider(currency: string, forcedProvider?: string): PaymentProvider {
        if (forcedProvider) {
            return forcedProvider === 'paystack'
                ? PaymentProvider.PAYSTACK
                : PaymentProvider.STRIPE;
        }

        return PAYSTACK_CURRENCIES.includes(currency.toUpperCase()) &&
            currency.toUpperCase() !== 'USD'
            ? PaymentProvider.PAYSTACK
            : PaymentProvider.STRIPE;
    }

    async initializePayment(userId: string, dto: InitializePaymentDto) {
        const booking = await this.bookingsService.findById(dto.bookingId);

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        // Check for existing successful payment
        const existingPayment = await this.paymentModel.findOne({
            booking: new Types.ObjectId(dto.bookingId),
            status: PaymentStatus.SUCCESS,
        });

        if (existingPayment) {
            throw new BadRequestException('Booking already paid');
        }

        const provider = this.selectProvider(dto.currency, dto.provider);
        const reference = generateReference();
        const amount = booking.pricing.totalAmount;

        let providerResponse: any;

        if (provider === PaymentProvider.STRIPE) {
            providerResponse = await this.stripeProvider.createCheckoutSession({
                amount,
                currency: dto.currency,
                bookingId: dto.bookingId,
                customerEmail: booking.contactDetails.email,
                callbackUrl: dto.callbackUrl,
                metadata: { reference },
            });
        } else {
            providerResponse = await this.paystackProvider.initializeTransaction({
                amount,
                currency: dto.currency,
                email: booking.contactDetails.email,
                reference,
                callbackUrl: dto.callbackUrl,
                metadata: { bookingId: dto.bookingId },
            });
        }

        // Create payment record
        const payment = new this.paymentModel({
            booking: new Types.ObjectId(dto.bookingId),
            user: new Types.ObjectId(userId),
            tenant: booking.tenant ? new Types.ObjectId(booking.tenant.toString()) : null,
            provider,
            providerReference: reference,
            amount,
            currency: dto.currency,
            status: PaymentStatus.PENDING,
            callbackUrl: dto.callbackUrl,
            metadata: providerResponse,
        });

        await payment.save();

        this.logger.log(
            `Payment initialized: ${reference} via ${provider} for ${dto.currency} ${amount}`,
        );

        return {
            paymentId: payment._id,
            reference,
            provider,
            amount,
            currency: dto.currency,
            ...providerResponse,
        };
    }

    async handleStripeWebhook(payload: string | Buffer, signature: string) {
        try {
            const event = this.stripeProvider.verifyWebhookSignature(
                payload,
                signature,
            );

            switch (event.type) {
                case 'checkout.session.completed':
                case 'payment_intent.succeeded': {
                    const sessionData = event.data.object as any;
                    const bookingId = sessionData.metadata?.bookingId;

                    if (bookingId) {
                        await this.processSuccessfulPayment(
                            bookingId,
                            sessionData.id || sessionData.payment_intent,
                            PaymentProvider.STRIPE,
                        );
                    }
                    break;
                }
                case 'payment_intent.payment_failed': {
                    const failedData = event.data.object as any;
                    const failedBookingId = failedData.metadata?.bookingId;

                    if (failedBookingId) {
                        await this.processFailedPayment(
                            failedBookingId,
                            PaymentProvider.STRIPE,
                        );
                    }
                    break;
                }
            }

            return { received: true };
        } catch (error) {
            this.logger.error(`Stripe webhook error: ${error.message}`);
            throw new BadRequestException('Webhook verification failed');
        }
    }

    async handlePaystackWebhook(payload: string, signature: string) {
        const isValid = this.paystackProvider.verifyWebhookSignature(
            payload,
            signature,
        );

        if (!isValid) {
            throw new BadRequestException('Invalid Paystack webhook signature');
        }

        const event = JSON.parse(payload);

        switch (event.event) {
            case 'charge.success': {
                const data = event.data;
                const bookingId = data.metadata?.bookingId;

                if (bookingId) {
                    await this.processSuccessfulPayment(
                        bookingId,
                        data.reference,
                        PaymentProvider.PAYSTACK,
                    );
                }
                break;
            }
            case 'charge.failed': {
                const failedData = event.data;
                const failedBookingId = failedData.metadata?.bookingId;

                if (failedBookingId) {
                    await this.processFailedPayment(
                        failedBookingId,
                        PaymentProvider.PAYSTACK,
                    );
                }
                break;
            }
        }

        return { received: true };
    }

    private async processSuccessfulPayment(
        bookingId: string,
        providerTransactionId: string,
        provider: PaymentProvider,
    ) {
        // Idempotent: check if already processed
        const existing = await this.paymentModel.findOne({
            booking: new Types.ObjectId(bookingId),
            status: PaymentStatus.SUCCESS,
        });

        if (existing) {
            this.logger.warn(`Payment already processed for booking: ${bookingId}`);
            return;
        }

        await this.paymentModel.findOneAndUpdate(
            { booking: new Types.ObjectId(bookingId), provider },
            {
                status: PaymentStatus.SUCCESS,
                providerTransactionId,
                paidAt: new Date(),
            },
        );

        // Confirm the booking
        await this.bookingsService.confirmBooking(bookingId);
        this.logger.log(`Payment successful for booking: ${bookingId}`);
    }

    private async processFailedPayment(
        bookingId: string,
        provider: PaymentProvider,
    ) {
        await this.paymentModel.findOneAndUpdate(
            { booking: new Types.ObjectId(bookingId), provider },
            { status: PaymentStatus.FAILED },
        );

        this.logger.warn(`Payment failed for booking: ${bookingId}`);
    }

    async refund(paymentId: string, dto: RefundPaymentDto) {
        const payment = await this.paymentModel.findById(paymentId).exec();
        if (!payment) throw new NotFoundException('Payment not found');

        if (payment.status !== PaymentStatus.SUCCESS) {
            throw new BadRequestException('Can only refund successful payments');
        }

        const refundAmount = dto.amount || payment.amount;
        let providerRefund: any;

        if (payment.provider === PaymentProvider.STRIPE) {
            providerRefund = await this.stripeProvider.refund(
                payment.providerTransactionId,
                dto.amount,
            );
        } else {
            providerRefund = await this.paystackProvider.refund(
                payment.providerReference,
                dto.amount,
            );
        }

        await this.paymentModel.findByIdAndUpdate(paymentId, {
            status: PaymentStatus.REFUNDED,
            refund: {
                amount: refundAmount,
                status: 'processed',
                reason: dto.reason,
                processedAt: new Date(),
                providerRefundId: providerRefund.refundId,
            },
        });

        this.logger.log(`Refund processed for payment: ${paymentId}`);
        return { refundAmount, ...providerRefund };
    }

    async findById(id: string): Promise<PaymentDocument> {
        const payment = await this.paymentModel
            .findById(id)
            .populate('booking')
            .populate('user', 'firstName lastName email')
            .lean()
            .exec();

        if (!payment) throw new NotFoundException('Payment not found');
        return payment as unknown as PaymentDocument;
    }

    async findByBooking(bookingId: string): Promise<PaymentDocument[]> {
        return this.paymentModel
            .find({ booking: new Types.ObjectId(bookingId) })
            .sort({ createdAt: -1 })
            .lean()
            .exec() as any;
    }
}
