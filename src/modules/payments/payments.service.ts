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
import { SystemConfigService } from "../system-config/system-config.service";
import { ResendService } from "../notifications/resend.service";

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
    private systemConfigService: SystemConfigService,
    private resendService: ResendService,
  ) {}

  /**
   * Appends query parameters to a callback URL that may or may not already
   * carry a query string.
   */
  private appendQuery(
    url: string | undefined,
    params: Record<string, string>,
  ): string {
    const base = url || "https://flybeth.com/callback";
    const separator = base.includes("?") ? "&" : "?";
    const query = new URLSearchParams(params).toString();
    return `${base}${separator}${query}`;
  }

  /**
   * Determine which payment provider to use based on currency.
   * Paystack for NGN, Stripe for everything else (PayPal as legacy/manual override).
   */
  private selectProvider(
    currency: string,
    forcedProvider?: string,
  ): PaymentProvider {
    if (forcedProvider) {
      const normalized = String(forcedProvider).toLowerCase().trim();
      const direct: Record<string, PaymentProvider> = {
        manual: PaymentProvider.MANUAL,
        wallet: PaymentProvider.WALLET,
        credpal: PaymentProvider.CREDPAL,
        affirm: PaymentProvider.AFFIRM,
        klarna: PaymentProvider.KLARNA,
        paypal_four: PaymentProvider.PAYPAL_FOUR,
        paypal: PaymentProvider.PAYPAL,
        cashapp: PaymentProvider.CASHAPP,
        afterpay: PaymentProvider.AFTERPAY,
        sezzle: PaymentProvider.SEZZLE,
        paystack: PaymentProvider.PAYSTACK,
        stripe: PaymentProvider.STRIPE,
      };

      const provider = direct[normalized];
      if (provider) return provider;

      // An unrecognised explicit choice must not silently become a card charge.
      throw new BadRequestException(
        `Unsupported payment provider: ${forcedProvider}`,
      );
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
        PaymentProvider.SEZZLE,
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
        url: this.appendQuery(dto.callbackUrl, {
          status: "pending_payment",
          reference,
        }),
      };
    }

    // Create payment record.
    //
    // `/payments/initialize` is public so guests can pay, which means there is
    // no authenticated user on the request. Attribute the payment to the user
    // who owns the booking when one exists, and allow `null` for genuine guest
    // checkouts instead of failing validation.
    const ownerId =
      userId && Types.ObjectId.isValid(userId)
        ? userId
        : booking.user
          ? booking.user.toString()
          : null;

    const payment = new this.paymentModel({
      booking: new Types.ObjectId(bookingId),
      user: ownerId && Types.ObjectId.isValid(ownerId)
        ? new Types.ObjectId(ownerId)
        : null,
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

  async getBanks(currency?: string): Promise<any[]> {
    let rawAccounts: any[] = [];
    if (this.systemConfigService) {
      try {
        const config = await this.systemConfigService.getConfig();
        if (config?.bankAccounts && config.bankAccounts.length > 0) {
          const accounts = config.bankAccounts.filter((b: any) => b.isActive !== false);
          if (currency) {
            const upper = currency.toUpperCase();
            const matched = accounts.filter((b: any) => b.currency?.toUpperCase() === upper);
            rawAccounts = matched.length > 0 ? matched : accounts;
          } else {
            rawAccounts = accounts;
          }
        }
      } catch (err: any) {
        this.logger.warn(`Failed to fetch bank accounts from SystemConfig: ${err?.message}`);
      }
    }
    if (!rawAccounts.length) {
      const query: any = { isActive: true };
      if (currency) query.currency = currency.toUpperCase();
      rawAccounts = await this.bankAccountModel.find(query).sort({ bankName: 1 }).lean().exec();
    }

    // Sanitize branding to FLYBETH LLC and strip instructions to protect sensitive credentials
    return (rawAccounts || []).map((acc: any) => {
      const plain = typeof acc?.toObject === 'function' ? acc.toObject() : { ...acc };
      if (plain.accountName) {
        plain.accountName = plain.accountName
          .replace(/Flybeth Global LLC/gi, 'FLYBETH LLC')
          .replace(/Flybeth Global/gi, 'FLYBETH LLC');
      }
      delete plain.instructions;
      return plain;
    });
  }

  async sendBankDetailsEmail(dto: { email: string; currency?: string; amount?: number; bookingRef?: string }): Promise<{ success: boolean; message: string }> {
    if (!dto.email) {
      throw new BadRequestException("Recipient email is required");
    }
    const upperCurrency = (dto.currency || 'USD').toUpperCase();
    const banks = await this.getBanks(upperCurrency);
    
    // Ensure accurate primary defaults if not populated
    const usBank = banks?.find((b: any) => b.bankName === 'Wells Fargo' || b.bankName === 'WellsFargo') || {
      bankName: 'Wells Fargo',
      accountName: 'FLYBETH LLC',
      accountNumber: '7288447936',
      routingNumber: '111900659',
      domesticWireRouting: '121000248',
      swiftCode: 'WFBIUS6S',
      currency: 'USD'
    };

    const wemaNgn = banks?.find((b: any) => b.currency === 'NGN') || {
      bankName: 'Wema Bank',
      accountName: 'Flybeth Limited',
      accountNumber: '0124034266',
      currency: 'NGN'
    };

    const wemaUsd = banks?.find((b: any) => b.bankName === 'Wema Bank' && b.currency === 'USD') || {
      bankName: 'Wema Bank',
      accountName: 'Flybeth Limited',
      accountNumber: '0620862082',
      currency: 'USD'
    };

    const formattedAmount = dto.amount 
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: upperCurrency }).format(dto.amount)
      : `${upperCurrency} Payment`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #1A2ED4 0%, #0D1DAD 100%); padding: 28px 32px;">
          <img src="https://res.cloudinary.com/dlnjbkoju/image/upload/v1794986834/logo_qeatej.png" alt="Flybeth" height="34" style="height: 34px; max-height: 40px; display: block; border: 0;" />
          <div style="color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 16px; opacity: 0.9;">Secure Settlement Credentials</div>
          <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 4px 0 0 0;">Official Payment & Bank Instructions</h2>
        </div>
        <div style="padding: 32px;">
          <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
            Hello,<br/><br/>
            You requested official bank settlement instructions for your reservation ${dto.bookingRef ? `<strong>(${dto.bookingRef})</strong>` : ''}. For your protection against cyber fraud and email interception, please transfer the exact reservation amount only to our verified corporate banking options below:
          </p>

          ${upperCurrency === 'USD' ? `
          <!-- Wells Fargo (United States) -->
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <div style="font-size: 12px; font-weight: 800; color: #0D1DAD; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
              <span>1. Wells Fargo Corporate Account (USA)</span>
              <span style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 6px; font-size: 10px;">USD Transactions</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Bank Name:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 800; text-align: right;">Wells Fargo</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Company / Account Name:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 800; text-align: right;">FLYBETH LLC</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Account Number:</td>
                <td style="padding: 6px 0; color: #0D1DAD; font-family: monospace; font-size: 16px; font-weight: 900; text-align: right;">7288447936</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Direct Deposit & ACH Routing:</td>
                <td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-weight: 800; text-align: right;">111900659</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Domestic Wire Routing:</td>
                <td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-weight: 800; text-align: right;">121000248</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">International Wire (SWIFT / BIC):</td>
                <td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-weight: 800; text-align: right;">WFBIUS6S</td>
              </tr>
            </table>
          </div>

          <!-- Zelle Payment -->
          <div style="background: #faf5ff; border: 1px solid #d8b4fe; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <div style="font-size: 12px; font-weight: 800; color: #7414CA; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
              2. Pay with Zelle® (Instant Settlement)
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Business Name:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 800; text-align: right;">FLYBETH LLC</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Zelle Recipient:</td>
                <td style="padding: 6px 0; color: #7414CA; font-family: monospace; font-size: 15px; font-weight: 900; text-align: right;">flybeth</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px 0 0 0; color: #6b21a8; font-size: 12px; line-height: 1.5;">
                  Scan the Zelle QR code in your Wells Fargo, Chase, BofA, or mobile banking app to pay FLYBETH LLC instantly.
                </td>
              </tr>
            </table>
          </div>

          <!-- Wema Bank USD (Nigeria Domiciliary) -->
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <div style="font-size: 12px; font-weight: 800; color: #0D1DAD; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
              3. Wema Bank USD Domiciliary Account (Nigeria)
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Bank Name:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 800; text-align: right;">Wema Bank</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Account Name:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 800; text-align: right;">Flybeth Limited</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Account Number:</td>
                <td style="padding: 6px 0; color: #0D1DAD; font-family: monospace; font-size: 16px; font-weight: 900; text-align: right;">0620862082</td>
              </tr>
            </table>
          </div>
          ` : `
          <!-- Wema Bank Naira (Nigeria) -->
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <div style="font-size: 12px; font-weight: 800; color: #0D1DAD; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
              Wema Bank Naira Account (NGN)
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Bank Name:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 800; text-align: right;">Wema Bank</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Account Name:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 800; text-align: right;">Flybeth Limited</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Account Number:</td>
                <td style="padding: 6px 0; color: #0D1DAD; font-family: monospace; font-size: 16px; font-weight: 900; text-align: right;">0124034266</td>
              </tr>
            </table>
          </div>
          `}

          ${dto.amount ? `
          <div style="background: #f1f5f9; border-radius: 10px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; font-weight: 700; color: #475569;">Total Amount Due:</span>
            <span style="font-size: 18px; font-weight: 900; color: #0D1DAD;">${formattedAmount}</span>
          </div>
          ` : ''}

          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px; font-size: 12px; color: #92400e; line-height: 1.5; margin-bottom: 24px;">
            <strong>Important:</strong> Please include your booking reference <strong>${dto.bookingRef || 'your name'}</strong> in the bank payment narration/memo. Once your transfer is approved by our finance desk, your e-tickets and verified tax receipt will be delivered instantly to your email.
          </div>

          <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.5;">
            Need help? Contact our 24/7 Concierge at <strong>support@flybeth.com</strong> or call <strong>1-844-FLYBETH</strong>.
          </p>
        </div>
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 11px; color: #94a3b8;">
          1500 S Dairy Ashford Road, Suite 207 # 703, Houston, TX 77077 · Flybeth Inc.
        </div>
      </div>
    `;

    try {
      if (this.resendService) {
        await this.resendService.sendEmail({
          to: dto.email,
          subject: `Official Bank Settlement Credentials ${dto.bookingRef ? `[${dto.bookingRef}]` : ''} - Flybeth`,
          html,
        });
      }
    } catch (err: any) {
      this.logger.error(`Failed to dispatch bank details email: ${err.message}`);
    }

    return { success: true, message: `Official settlement credentials dispatched to ${dto.email}` };
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
