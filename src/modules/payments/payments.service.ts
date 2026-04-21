// src/modules/payments/payments.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Payment, PaymentDocument } from "./schemas/payment.schema";
import { InitializePaymentDto, RefundPaymentDto } from "./dto/payment.dto";
import { StripeProvider } from "./providers/stripe.provider";
import { PaystackProvider } from "./providers/paystack.provider";
import {
  BankAccount,
  BankAccountDocument,
} from "./schemas/bank-account.schema";
import { BookingsService } from "../bookings/bookings.service";
import { BookingDocument } from "../bookings/schemas/booking.schema";
import {
  PaymentStatus,
  PaymentProvider,
  PAYSTACK_CURRENCIES,
} from "../../common/constants/roles.constant";
import { generateReference } from "../../common/utils/crypto.util";
import { WalletService } from "../finance/wallet.service";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(BankAccount.name)
    private bankAccountModel: Model<BankAccountDocument>,
    private stripeProvider: StripeProvider,
    private paystackProvider: PaystackProvider,
    private bookingsService: BookingsService,
    private walletService: WalletService,
  ) {}

  /**
   * Determine which payment provider to use based on currency.
   * Paystack for African currencies, Stripe for everything else.
   */
  private selectProvider(
    currency: string,
    forcedProvider?: string,
  ): PaymentProvider {
    if (forcedProvider) {
      if (forcedProvider === "manual") return PaymentProvider.MANUAL;
      if (forcedProvider === "wallet") return PaymentProvider.WALLET;
      return forcedProvider === "paystack"
        ? PaymentProvider.PAYSTACK
        : PaymentProvider.STRIPE;
    }

    return PAYSTACK_CURRENCIES.includes(currency.toUpperCase()) &&
      currency.toUpperCase() !== "USD"
      ? PaymentProvider.PAYSTACK
      : PaymentProvider.STRIPE;
  }

  async initializePayment(userId?: string, dto?: InitializePaymentDto) {
    if (!dto?.bookingId) {
      throw new BadRequestException("Booking ID is required");
    }

    let booking: BookingDocument | null = null;

    // Try to find by Mongo ID first
    if (Types.ObjectId.isValid(dto.bookingId)) {
      booking = await this.bookingsService.findById(dto.bookingId);
    } else {
      // If not a Mongo ID, try searching by PNR
      try {
        booking = await this.bookingsService.findByPNR(dto.bookingId);
      } catch (pnrError) {
        this.logger.warn(
          `Could not find booking with reference: ${dto.bookingId}`,
        );
      }
    }

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const bookingId = (booking as any)._id?.toString() || dto.bookingId;

    // Check for existing successful payment
    const existingPayment = await this.paymentModel.findOne({
      booking: new Types.ObjectId(bookingId),
      status: PaymentStatus.SUCCESS,
    });

    if (existingPayment) {
      throw new BadRequestException("Booking already paid");
    }

    const currency = dto.currency || booking.pricing.currency || "USD";
    const provider = this.selectProvider(currency, dto.provider);
    const reference = generateReference();
    const amount = booking.pricing.totalAmount;

    let providerResponse: any;

    if (provider === PaymentProvider.STRIPE) {
      providerResponse = await this.stripeProvider.createCheckoutSession({
        amount,
        currency: currency,
        bookingId: dto.bookingId,
        customerEmail: booking.contactDetails.email,
        callbackUrl: dto.callbackUrl,
        metadata: { reference },
      });
    } else if (provider === PaymentProvider.PAYSTACK) {
      providerResponse = await this.paystackProvider.initializeTransaction({
        amount,
        currency: currency,
        email: booking.contactDetails.email,
        reference,
        callbackUrl: dto.callbackUrl,
        metadata: { bookingId: dto.bookingId },
      });
    } else if (provider === PaymentProvider.WALLET) {
       if (!userId) throw new BadRequestException("User ID is required for wallet payments");
       
       // Verify Wallet PIN if provided in metadata (for extra security)
       if (dto.metadata?.pin) {
         const isPinValid = await this.walletService.verifyPin(userId, dto.metadata.pin);
         if (!isPinValid) throw new BadRequestException("Invalid Wallet PIN");
       }

       await this.walletService.debit(userId, amount, `Payment for booking ${booking.pnr}`, bookingId);
       providerResponse = {
         status: "success",
         message: "Payment processed via Flybeth Wallet",
         reference,
       };
    } else {
      // Manual Payment Flow
      providerResponse = {
        status: "awaiting_transfer",
        instruction:
          "Please transfer the exact amount to any of the provided bank accounts.",
        reference,
        url: `${dto.callbackUrl}&status=pending_payment&reference=${reference}`,
      };
    }

    // Create payment record
    const payment = new this.paymentModel({
      booking: new Types.ObjectId(dto.bookingId),
      user: new Types.ObjectId(userId),
      tenant: booking.tenant
        ? new Types.ObjectId(booking.tenant.toString())
        : null,
      provider,
      providerReference: reference,
      amount,
      currency: currency,
      status: PaymentStatus.PENDING,
      callbackUrl: dto.callbackUrl,
      metadata: providerResponse,
    });

    await payment.save();

    if (provider === PaymentProvider.WALLET) {
      await this.processSuccessfulPayment(bookingId, reference, PaymentProvider.WALLET);
    }

    this.logger.log(
      `Payment initialized: ${reference} via ${provider} for ${dto.currency} ${amount}`,
    );

    return {
      paymentId: payment._id,
      reference,
      provider,
      amount,
      currency: currency,
      ...providerResponse,
    };
  }

  async createPaymentIntent(
    userId: string,
    bookingId: string,
    currency: string,
  ) {
    let booking: BookingDocument | null = null;
    if (Types.ObjectId.isValid(bookingId)) {
      booking = await this.bookingsService.findById(bookingId);
    } else {
      booking = await this.bookingsService.findByPNR(bookingId);
    }

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const amount = booking.pricing.totalAmount;
    const metadata = { bookingId: booking._id.toString(), userId };

    const intent = await this.stripeProvider.createPaymentIntent({
      amount,
      currency: currency.toLowerCase(),
      bookingId: booking._id.toString(),
      metadata,
    });

    return {
      clientSecret: intent.clientSecret,
      amount,
      currency,
    };
  }

  async handleStripeWebhook(payload: string | Buffer, signature: string) {
    try {
      const event = this.stripeProvider.verifyWebhookSignature(
        payload,
        signature,
      );

      switch (event.type) {
        case "checkout.session.completed":
        case "payment_intent.succeeded": {
          const sessionData = event.data.object as any;
          const metadata = sessionData.metadata;

          if (metadata?.type === 'wallet_topup') {
             const userId = metadata.userId;
             const amount = sessionData.amount_total / 100;
             await this.walletService.credit(userId, amount, `Wallet top-up via Stripe`, { sessionId: sessionData.id });
             this.logger.log(`Wallet topped up: User ${userId}, Amount ${amount}`);
             break;
          }

          const bookingId = metadata?.bookingId;

          if (bookingId) {
            await this.processSuccessfulPayment(
              bookingId,
              sessionData.id || sessionData.payment_intent,
              PaymentProvider.STRIPE,
            );
          }
          break;
        }
        case "payment_intent.payment_failed": {
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
      throw new BadRequestException("Webhook verification failed");
    }
  }

  async handlePaystackWebhook(payload: string, signature: string) {
    const isValid = this.paystackProvider.verifyWebhookSignature(
      payload,
      signature,
    );

    if (!isValid) {
      throw new BadRequestException("Invalid Paystack webhook signature");
    }

    const event = JSON.parse(payload);

    switch (event.event) {
      case "charge.success": {
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
      case "charge.failed": {
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
    if (!payment) throw new NotFoundException("Payment not found");

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException("Can only refund successful payments");
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
        status: "processed",
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
      .populate("booking")
      .populate("user", "firstName lastName email")
      .lean()
      .exec();

    if (!payment) throw new NotFoundException("Payment not found");
    return payment as unknown as PaymentDocument;
  }

  async findByBooking(bookingId: string): Promise<PaymentDocument[]> {
    return this.paymentModel
      .find({ booking: new Types.ObjectId(bookingId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec() as any;
  }

  async getBanks(currency?: string): Promise<BankAccountDocument[]> {
    const query: any = { isActive: true };
    if (currency) query.currency = currency.toUpperCase();
    return this.bankAccountModel.find(query).sort({ bankName: 1 }).exec();
  }

  async getPaystackBanks() {
    return this.paystackProvider.getBanks();
  }

  async verifyBankAccount(account_number: string, bank_code: string) {
    return this.paystackProvider.resolveAccount(account_number, bank_code);
  }

  async initializeTopUp(userId: string, data: { amount: number, currency: string, email: string, callbackUrl: string }) {
     return this.stripeProvider.createTopUpSession({
        userId,
        customerEmail: data.email,
        amount: data.amount,
        currency: data.currency,
        callbackUrl: data.callbackUrl
     });
  }
}
