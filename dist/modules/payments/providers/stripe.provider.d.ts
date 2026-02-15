import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
export declare class StripeProvider {
    private configService;
    private stripe;
    private readonly logger;
    constructor(configService: ConfigService);
    createCheckoutSession(params: {
        amount: number;
        currency: string;
        bookingId: string;
        customerEmail: string;
        callbackUrl?: string;
        metadata?: Record<string, string>;
    }): Promise<{
        sessionId: string;
        url: string | null;
        paymentIntentId: string;
    }>;
    createPaymentIntent(params: {
        amount: number;
        currency: string;
        bookingId: string;
        metadata?: Record<string, string>;
    }): Promise<{
        clientSecret: string | null;
        paymentIntentId: string;
    }>;
    refund(paymentIntentId: string, amount?: number): Promise<{
        refundId: string;
        status: string | null;
        amount: number;
    }>;
    verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event;
}
