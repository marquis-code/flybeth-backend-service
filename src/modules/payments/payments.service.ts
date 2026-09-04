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
import { PaypalProvider } from "./providers/paypal.provider";
import { PaystackProvider } from "./providers/paystack.provider";
import { StripeProvider } from "./providers/stripe.provider";
import { CashAppProvider } from "./providers/cashapp.provider";
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
import { BnplFactory } from "./bnpl/bnpl.factory";
import { OrderFulfillmentService } from "../bookings/order-fulfillment.service";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(BankAccount.name)
    private bankAccountModel: Model<BankAccountDocument>,
    private paypalProvider: PaypalProvider,
    private paystackProvider: PaystackProvider,
    private stripeProvider: StripeProvider,
    private cashAppProvider: CashAppProvider,
    private bookingsService: BookingsService,
    private walletService: WalletService,
    private bnplFactory: BnplFactory,
    private orderFulfillmentService: OrderFulfillmentService,
  ) {}
  /**
   * Determine which payment provider to use based on currency.
   * Paystack for NGN, Stripe for everything else (PayPal as legacy/manual override).
   */
  private selectProvider(
    currency: string,
    forcedProvider?: string,
  ): PaymentProvider {
    if (forcedProvider) {
      if (forcedProvider === "manual") return PaymentProvider.MANUAL;
      if (forcedProvider === "wallet") return PaymentProvider.WALLET;
      if (forcedProvider === "credpal") return PaymentProvider.CREDPAL;
      if (forcedProvider === "affirm") return PaymentProvider.AFFIRM;
      if (forcedProvider === "klarna") return PaymentProvider.KLARNA;
      if (forcedProvider === "paypal_four") return PaymentProvider.PAYPAL_FOUR;
      if (forcedProvider === "paypal") return PaymentProvider.PAYPAL;
      if (forcedProvider === "cashapp") return PaymentProvider.CASHAPP;
      
      return forcedProvider === "paystack"
        ? PaymentProvider.PAYSTACK
        : PaymentProvider.STRIPE;
    }

    return currency.toUpperCase() === "NGN"
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

    if (provider === PaymentProvider.PAYPAL) {
      providerResponse = await this.paypalProvider.createOrder({
        amount,
        currency: currency,
        bookingId: dto.bookingId,
        callbackUrl: dto.callbackUrl || "https://flybeth.com/callback",
        reference,
      });
    } else if (provider === PaymentProvider.STRIPE) {
      providerResponse = await this.stripeProvider.createSession({
        amount,
        currency: currency,
        bookingId: dto.bookingId,
        callbackUrl: dto.callbackUrl || "https://flybeth.com/callback",
        reference,
        email: booking.contactDetails.email,
      });
    } else if (provider === PaymentProvider.PAYSTACK) {
      const paystackRes = await this.paystackProvider.initializeTransaction({
        amount,
        currency: currency,
        email: booking.contactDetails.email,
        reference,
        callbackUrl: dto.callbackUrl,
        metadata: { bookingId: dto.bookingId },
      });
      providerResponse = {
        ...paystackRes.data,
        url: paystackRes.data?.authorization_url,
      };
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
    } else if (
      [
        PaymentProvider.CREDPAL,
        PaymentProvider.AFFIRM,
        PaymentProvider.KLARNA,
        PaymentProvider.PAYPAL_FOUR,
        PaymentProvider.AFTERPAY,
      ].includes(provider)
    ) {
      const bnplStrategy = this.bnplFactory.getStrategy(provider);
      const bnplResult = await bnplStrategy.initializePayment(
        bookingId,
        amount,
        currency,
        {
          ...dto.metadata,
          contactDetails: booking.contactDetails,
          callbackUrl: dto.callbackUrl,
          pnr: booking.pnr
        },
      );
      providerResponse = {
        status: "initialized",
        url: bnplResult.checkoutUrl,
        reference: bnplResult.reference,
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
    // Legacy endpoint: if used, we just return a paypal intent instead
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
    const reference = generateReference();

    const intent = await this.paypalProvider.createOrder({
      amount,
      currency: currency.toLowerCase(),
      bookingId: booking._id.toString(),
      reference,
      callbackUrl: "https://flybeth.com/callback", // placeholder
    });

    return {
      clientSecret: intent.orderId,
      amount,
      currency,
    };
  }

  async handleStripeWebhook(body: string | Buffer, signature: string) {
    let event;
    try {
      event = this.stripeProvider.verifyWebhookSignature(body, signature);
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      if (session.payment_status === 'paid') {
        const bookingId = session.metadata?.bookingId;
        const reference = session.client_reference_id;
        
        if (bookingId && reference) {
          await this.processSuccessfulPayment(bookingId, reference, PaymentProvider.STRIPE);
        }
      }
    }

    return { received: true };
  }

  async handleCashAppWebhook(method: string, urlPath: string, headers: Record<string, string>, rawBody: string, signature: string) {
    const isValid = this.cashAppProvider.verifyWebhookSignature(method, urlPath, headers, rawBody, signature);
    
    if (!isValid) {
      throw new BadRequestException("Invalid Cash App Pay webhook signature");
    }

    const event = JSON.parse(rawBody);

    switch (event.type) {
      case "payment.status.updated": {
        const data = event.data?.object;
        const bookingId = data?.reference_id; // Using reference_id as bookingId based on our createPayment implementation
        const status = data?.status;

        if (bookingId && status === 'CAPTURED') {
          await this.processSuccessfulPayment(
            bookingId,
            data.id,
            PaymentProvider.CASHAPP,
          );
        } else if (bookingId && (status === 'FAILED' || status === 'CANCELED' || status === 'DECLINED')) {
          await this.processFailedPayment(
            bookingId,
            PaymentProvider.CASHAPP,
          );
        }
        break;
      }
      // Can handle other types like grant.status.updated if needed
      default:
        this.logger.log(`Received unhandled Cash App webhook event type: ${event.type}`);
    }

    return { received: true };
  }

  async handlePaypalWebhook(payload: string, signature: string) {
    try {
      // Basic webhook implementation
      const event = JSON.parse(payload);

      switch (event.event_type) {
        case "CHECKOUT.ORDER.APPROVED": {
          const resource = event.resource;
          const orderId = resource.id;
          const customId = resource.purchase_units?.[0]?.custom_id;

          if (customId === 'wallet_topup') {
             // Wallet top-up via PayPal
             const userId = resource.purchase_units?.[0]?.reference_id; // we can pass userId here
             const amount = parseFloat(resource.purchase_units?.[0]?.amount?.value);
             // Verify the order has been captured
             await this.paypalProvider.captureOrder(orderId);
             await this.walletService.credit(userId, amount, `Wallet top-up via PayPal`, { orderId });
             this.logger.log(`Wallet topped up: User ${userId}, Amount ${amount}`);
             break;
          }

          const bookingId = customId;

          if (bookingId) {
            // Automatically capture the payment when approved
            await this.paypalProvider.captureOrder(orderId);
            
            await this.processSuccessfulPayment(
              bookingId,
              orderId,
              PaymentProvider.PAYPAL,
            );
          }
          break;
        }
        case "PAYMENT.CAPTURE.DENIED": {
          const failedData = event.resource;
          const failedBookingId = failedData.custom_id;

          if (failedBookingId) {
            await this.processFailedPayment(
              failedBookingId,
              PaymentProvider.PAYPAL,
            );
          }
          break;
        }
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`PayPal webhook error: ${error.message}`);
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

  async handleBnplWebhook(
    gateway: PaymentProvider,
    payload: any,
    signature: string,
  ) {
    const strategy = this.bnplFactory.getStrategy(gateway);
    const isValid = await strategy.verifyWebhook(payload, signature);

    if (!isValid) {
      throw new BadRequestException(`Invalid signature for ${gateway} webhook`);
    }

    // Usually BNPL webhooks contain a reference and a status
    // This is a generic implementation, specific providers might need mapping
    const reference = payload.reference || payload.token || payload.id;
    const status = payload.status || payload.event;

    if (status === "SUCCESS" || status === "APPROVED" || status === "COMPLETED" || status === "captured") {
      const payment = await this.paymentModel.findOne({
        providerReference: reference,
      });

      if (payment) {
        await this.processSuccessfulPayment(
          payment.booking.toString(),
          reference,
          gateway,
        );
      }
    }

    return { received: true };
  }

  async authorizeBnplPayment(dto: { bookingId: string; provider: PaymentProvider; checkoutToken: string; amount: number; currency: string }) {
    const strategy = this.bnplFactory.getStrategy(dto.provider);
    
    // Check if the strategy supports the authorization step (Affirm does)
    if (strategy.authorizePayment) {
      const isAuthorized = await strategy.authorizePayment(dto.checkoutToken, dto.bookingId, dto.amount, dto.currency);
      
      if (!isAuthorized) {
        await this.processFailedPayment(dto.bookingId, dto.provider);
        throw new BadRequestException(`Authorization failed for ${dto.provider}`);
      }
    }

    // Process payment as successful since authorization/capture succeeded or isn't required
    await this.processSuccessfulPayment(dto.bookingId, dto.checkoutToken, dto.provider);
    
    return { success: true, message: 'Payment authorized and processed successfully' };
  }

  async verifyPayment(dto: { bookingId: string; provider: PaymentProvider; checkoutToken: string; amount?: number; currency?: string }) {
    if (
      [
        PaymentProvider.CREDPAL,
        PaymentProvider.AFFIRM,
        PaymentProvider.KLARNA,
        PaymentProvider.PAYPAL_FOUR,
      ].includes(dto.provider)
    ) {
      // Delegate to existing BNPL authorization logic
      return this.authorizeBnplPayment({
        bookingId: dto.bookingId,
        provider: dto.provider,
        checkoutToken: dto.checkoutToken,
        amount: dto.amount || 0,
        currency: dto.currency || "USD"
      });
    }

    if (dto.provider === PaymentProvider.PAYSTACK) {
      const verification = await this.paystackProvider.verifyTransaction(dto.checkoutToken);
      if (verification.status === "success") {
        await this.processSuccessfulPayment(dto.bookingId, dto.checkoutToken, dto.provider);
        return { success: true, message: 'Payment verified successfully' };
      }
      throw new BadRequestException("Payment verification failed or pending");
    }

    if (dto.provider === PaymentProvider.PAYPAL) {
      // PayPal checkout token (orderId) needs to be captured
      try {
        await this.paypalProvider.captureOrder(dto.checkoutToken);
        await this.processSuccessfulPayment(dto.bookingId, dto.checkoutToken, dto.provider);
        return { success: true, message: 'Payment verified and captured successfully' };
      } catch (e) {
        throw new BadRequestException("PayPal capture failed");
      }
    }

    if (dto.provider === PaymentProvider.STRIPE) {
      try {
        await this.stripeProvider.captureOrder(dto.checkoutToken);
        await this.processSuccessfulPayment(dto.bookingId, dto.checkoutToken, dto.provider);
        return { success: true, message: 'Payment verified and captured successfully' };
      } catch (e) {
        throw new BadRequestException("Stripe capture failed or session not paid");
      }
    }

    throw new BadRequestException(`Verification not supported for provider: ${dto.provider}`);
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

    // Confirm and fulfill the booking using the new Fulfillment Service
    try {
      await this.orderFulfillmentService.finalizeTravelBooking(bookingId);
    } catch (error) {
      this.logger.error(`Fulfillment error for booking ${bookingId}: ${error.message}`);
      // Fallback to basic confirmation if fulfillment service fails but payment is good
      await this.bookingsService.confirmBooking(bookingId);
    }

    // Send booking confirmation email with invoice AFTER payment is confirmed
    try {
      const confirmedBooking = await this.bookingsService.findById(bookingId);
      await this.bookingsService.sendBookingConfirmationEmail(confirmedBooking);
    } catch (emailError) {
      this.logger.error(`Failed to send confirmation email for booking ${bookingId}: ${emailError.message}`);
    }
    
    this.logger.log(`Payment successful and fulfillment triggered for booking: ${bookingId}`);
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

    if (payment.provider === PaymentProvider.PAYPAL) {
      providerRefund = await this.paypalProvider.refund(
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
     return this.paypalProvider.createOrder({
        bookingId: 'wallet_topup',
        reference: userId, // pass user id as reference
        currency: data.currency,
        amount: data.amount,
        callbackUrl: data.callbackUrl
     });
  }

  async processCashAppPayment(bookingId: string, grantId: string) {
    let booking: BookingDocument | null = null;
    if (Types.ObjectId.isValid(bookingId)) {
      booking = await this.bookingsService.findById(bookingId);
    } else {
      booking = await this.bookingsService.findByPNR(bookingId);
    }

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const actualBookingId = (booking as any)._id?.toString() || bookingId;

    // Check for existing successful payment
    const existingPayment = await this.paymentModel.findOne({
      booking: new Types.ObjectId(actualBookingId),
      status: PaymentStatus.SUCCESS,
    });

    if (existingPayment) {
      throw new BadRequestException("Booking already paid");
    }

    const amount = booking.pricing.totalAmount;
    const currency = booking.pricing.currency || "USD";

    const response = await this.cashAppProvider.createPayment({
      amount,
      currency,
      grantId,
    });

    // Create payment record
    const payment = await this.paymentModel.create({
      booking: new Types.ObjectId(actualBookingId),
      amount,
      currency,
      provider: PaymentProvider.CASHAPP,
      reference: response.data.payment?.id || `CASHAPP-${Date.now()}`,
      status: response.status === 'success' ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
      metadata: response.data,
    });

    if (payment.status === PaymentStatus.SUCCESS) {
      // Trigger order fulfillment
      await this.orderFulfillmentService.finalizeTravelBooking(actualBookingId);
    }

    return payment;
  }
}
