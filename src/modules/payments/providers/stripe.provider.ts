import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

@Injectable()
export class StripeProvider {
  private readonly logger = new Logger(StripeProvider.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>("STRIPE_SECRET_KEY") || "mock_stripe_secret";
    this.stripe = new Stripe(secretKey, {
      apiVersion: "2024-04-10" as any, // latest API version at time of write
    });
    this.webhookSecret = this.configService.get<string>("STRIPE_WEBHOOK_SECRET") || "whsec_placeholder";
  }

  async createSession(params: {
    amount: number;
    currency: string;
    bookingId: string;
    reference: string;
    callbackUrl: string;
    email?: string;
  }) {
    let finalCurrency = params.currency.toLowerCase();

    // Stripe requires amount in smallest currency unit (cents)
    // Most currencies have 2 decimal places, but some are zero-decimal
    const zeroDecimalCurrencies = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];
    let finalAmount = params.amount;
    if (!zeroDecimalCurrencies.includes(finalCurrency)) {
      finalAmount = Math.round(params.amount * 100);
    } else {
      finalAmount = Math.round(params.amount);
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        customer_email: params.email,
        line_items: [
          {
            price_data: {
              currency: finalCurrency,
              product_data: {
                name: "Flybeth Booking",
                description: `Booking Reference: ${params.bookingId}`,
                tax_code: 'txcd_20030000', // Passenger Transportation
              },
              unit_amount: finalAmount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: params.callbackUrl.includes('?')
          ? `${params.callbackUrl}&reference=${params.reference}`
          : `${params.callbackUrl}?status=success&reference=${params.reference}`,
        cancel_url: params.callbackUrl.includes('?')
          ? `${params.callbackUrl.replace('status=success', 'status=cancelled')}&reference=${params.reference}`
          : `${params.callbackUrl}?status=cancelled&reference=${params.reference}`,
        client_reference_id: params.reference,
        managed_payments: {
          enabled: false,
        },
        metadata: {
          bookingId: params.bookingId,
          reference: params.reference
        },
      });

      return {
        orderId: session.id,
        status: session.payment_status,
        url: session.url,
        reference: params.reference,
      };
    } catch (error: any) {
      this.logger.error("Failed to create Stripe session", error);
      throw new BadRequestException(`Failed to initialize Stripe payment: ${error.message || error}`);
    }
  }

  async captureOrder(sessionId: string) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') {
        throw new BadRequestException("Stripe session not paid yet");
      }
      return session;
    } catch (error) {
      this.logger.error(`Failed to verify Stripe session ${sessionId}`, error);
      throw new BadRequestException("Failed to verify Stripe payment");
    }
  }

  async refund(paymentIntentId: string, amount?: number) {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };
      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Assuming 2 decimal currency
      }
      const refund = await this.stripe.refunds.create(refundParams);
      return {
        refundId: refund.id,
        status: refund.status
      };
    } catch (error) {
      this.logger.error(`Failed to refund Stripe payment ${paymentIntentId}`, error);
      throw new BadRequestException("Failed to process Stripe refund");
    }
  }

  verifyWebhookSignature(body: string | Buffer, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(body, signature, this.webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }
}
