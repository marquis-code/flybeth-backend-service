"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const payment_schema_1 = require("./schemas/payment.schema");
const stripe_provider_1 = require("./providers/stripe.provider");
const paystack_provider_1 = require("./providers/paystack.provider");
const bookings_service_1 = require("../bookings/bookings.service");
const roles_constant_1 = require("../../common/constants/roles.constant");
const crypto_util_1 = require("../../common/utils/crypto.util");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(paymentModel, stripeProvider, paystackProvider, bookingsService) {
        this.paymentModel = paymentModel;
        this.stripeProvider = stripeProvider;
        this.paystackProvider = paystackProvider;
        this.bookingsService = bookingsService;
        this.logger = new common_1.Logger(PaymentsService_1.name);
    }
    selectProvider(currency, forcedProvider) {
        if (forcedProvider) {
            return forcedProvider === 'paystack'
                ? roles_constant_1.PaymentProvider.PAYSTACK
                : roles_constant_1.PaymentProvider.STRIPE;
        }
        return roles_constant_1.PAYSTACK_CURRENCIES.includes(currency.toUpperCase()) &&
            currency.toUpperCase() !== 'USD'
            ? roles_constant_1.PaymentProvider.PAYSTACK
            : roles_constant_1.PaymentProvider.STRIPE;
    }
    async initializePayment(userId, dto) {
        const booking = await this.bookingsService.findById(dto.bookingId);
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        const existingPayment = await this.paymentModel.findOne({
            booking: new mongoose_2.Types.ObjectId(dto.bookingId),
            status: roles_constant_1.PaymentStatus.SUCCESS,
        });
        if (existingPayment) {
            throw new common_1.BadRequestException('Booking already paid');
        }
        const provider = this.selectProvider(dto.currency, dto.provider);
        const reference = (0, crypto_util_1.generateReference)();
        const amount = booking.pricing.totalAmount;
        let providerResponse;
        if (provider === roles_constant_1.PaymentProvider.STRIPE) {
            providerResponse = await this.stripeProvider.createCheckoutSession({
                amount,
                currency: dto.currency,
                bookingId: dto.bookingId,
                customerEmail: booking.contactDetails.email,
                callbackUrl: dto.callbackUrl,
                metadata: { reference },
            });
        }
        else {
            providerResponse = await this.paystackProvider.initializeTransaction({
                amount,
                currency: dto.currency,
                email: booking.contactDetails.email,
                reference,
                callbackUrl: dto.callbackUrl,
                metadata: { bookingId: dto.bookingId },
            });
        }
        const payment = new this.paymentModel({
            booking: new mongoose_2.Types.ObjectId(dto.bookingId),
            user: new mongoose_2.Types.ObjectId(userId),
            tenant: booking.tenant ? new mongoose_2.Types.ObjectId(booking.tenant.toString()) : null,
            provider,
            providerReference: reference,
            amount,
            currency: dto.currency,
            status: roles_constant_1.PaymentStatus.PENDING,
            callbackUrl: dto.callbackUrl,
            metadata: providerResponse,
        });
        await payment.save();
        this.logger.log(`Payment initialized: ${reference} via ${provider} for ${dto.currency} ${amount}`);
        return {
            paymentId: payment._id,
            reference,
            provider,
            amount,
            currency: dto.currency,
            ...providerResponse,
        };
    }
    async handleStripeWebhook(payload, signature) {
        try {
            const event = this.stripeProvider.verifyWebhookSignature(payload, signature);
            switch (event.type) {
                case 'checkout.session.completed':
                case 'payment_intent.succeeded': {
                    const sessionData = event.data.object;
                    const bookingId = sessionData.metadata?.bookingId;
                    if (bookingId) {
                        await this.processSuccessfulPayment(bookingId, sessionData.id || sessionData.payment_intent, roles_constant_1.PaymentProvider.STRIPE);
                    }
                    break;
                }
                case 'payment_intent.payment_failed': {
                    const failedData = event.data.object;
                    const failedBookingId = failedData.metadata?.bookingId;
                    if (failedBookingId) {
                        await this.processFailedPayment(failedBookingId, roles_constant_1.PaymentProvider.STRIPE);
                    }
                    break;
                }
            }
            return { received: true };
        }
        catch (error) {
            this.logger.error(`Stripe webhook error: ${error.message}`);
            throw new common_1.BadRequestException('Webhook verification failed');
        }
    }
    async handlePaystackWebhook(payload, signature) {
        const isValid = this.paystackProvider.verifyWebhookSignature(payload, signature);
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid Paystack webhook signature');
        }
        const event = JSON.parse(payload);
        switch (event.event) {
            case 'charge.success': {
                const data = event.data;
                const bookingId = data.metadata?.bookingId;
                if (bookingId) {
                    await this.processSuccessfulPayment(bookingId, data.reference, roles_constant_1.PaymentProvider.PAYSTACK);
                }
                break;
            }
            case 'charge.failed': {
                const failedData = event.data;
                const failedBookingId = failedData.metadata?.bookingId;
                if (failedBookingId) {
                    await this.processFailedPayment(failedBookingId, roles_constant_1.PaymentProvider.PAYSTACK);
                }
                break;
            }
        }
        return { received: true };
    }
    async processSuccessfulPayment(bookingId, providerTransactionId, provider) {
        const existing = await this.paymentModel.findOne({
            booking: new mongoose_2.Types.ObjectId(bookingId),
            status: roles_constant_1.PaymentStatus.SUCCESS,
        });
        if (existing) {
            this.logger.warn(`Payment already processed for booking: ${bookingId}`);
            return;
        }
        await this.paymentModel.findOneAndUpdate({ booking: new mongoose_2.Types.ObjectId(bookingId), provider }, {
            status: roles_constant_1.PaymentStatus.SUCCESS,
            providerTransactionId,
            paidAt: new Date(),
        });
        await this.bookingsService.confirmBooking(bookingId);
        this.logger.log(`Payment successful for booking: ${bookingId}`);
    }
    async processFailedPayment(bookingId, provider) {
        await this.paymentModel.findOneAndUpdate({ booking: new mongoose_2.Types.ObjectId(bookingId), provider }, { status: roles_constant_1.PaymentStatus.FAILED });
        this.logger.warn(`Payment failed for booking: ${bookingId}`);
    }
    async refund(paymentId, dto) {
        const payment = await this.paymentModel.findById(paymentId).exec();
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        if (payment.status !== roles_constant_1.PaymentStatus.SUCCESS) {
            throw new common_1.BadRequestException('Can only refund successful payments');
        }
        const refundAmount = dto.amount || payment.amount;
        let providerRefund;
        if (payment.provider === roles_constant_1.PaymentProvider.STRIPE) {
            providerRefund = await this.stripeProvider.refund(payment.providerTransactionId, dto.amount);
        }
        else {
            providerRefund = await this.paystackProvider.refund(payment.providerReference, dto.amount);
        }
        await this.paymentModel.findByIdAndUpdate(paymentId, {
            status: roles_constant_1.PaymentStatus.REFUNDED,
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
    async findById(id) {
        const payment = await this.paymentModel
            .findById(id)
            .populate('booking')
            .populate('user', 'firstName lastName email')
            .lean()
            .exec();
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        return payment;
    }
    async findByBooking(bookingId) {
        return this.paymentModel
            .find({ booking: new mongoose_2.Types.ObjectId(bookingId) })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        stripe_provider_1.StripeProvider,
        paystack_provider_1.PaystackProvider,
        bookings_service_1.BookingsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map