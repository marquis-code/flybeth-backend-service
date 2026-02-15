// src/modules/payments/providers/stripe.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeProvider {
    private stripe: Stripe;
    private readonly logger = new Logger(StripeProvider.name);

    constructor(private configService: ConfigService) {
        this.stripe = new Stripe(
            this.configService.get<string>('STRIPE_SECRET_KEY') || '',
            { apiVersion: '2024-12-18.acacia' as any },
        );
    }

    async createCheckoutSession(params: {
        amount: number;
        currency: string;
        bookingId: string;
        customerEmail: string;
        callbackUrl?: string;
        metadata?: Record<string, string>;
    }) {
        try {
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                customer_email: params.customerEmail,
                line_items: [
                    {
                        price_data: {
                            currency: params.currency.toLowerCase(),
                            product_data: {
                                name: `Flight Booking - ${params.bookingId}`,
                                description: `Payment for booking ${params.bookingId}`,
                            },
                            unit_amount: Math.round(params.amount * 100), // Stripe expects cents
                        },
                        quantity: 1,
                    },
                ],
                metadata: {
                    bookingId: params.bookingId,
                    ...params.metadata,
                },
                success_url: params.callbackUrl
                    ? `${params.callbackUrl}?session_id={CHECKOUT_SESSION_ID}`
                    : undefined,
                cancel_url: params.callbackUrl
                    ? `${params.callbackUrl}?cancelled=true`
                    : undefined,
            });

            return {
                sessionId: session.id,
                url: session.url,
                paymentIntentId: session.payment_intent as string,
            };
        } catch (error) {
            this.logger.error(`Stripe session creation failed: ${error.message}`);
            throw error;
        }
    }

    async createPaymentIntent(params: {
        amount: number;
        currency: string;
        bookingId: string;
        metadata?: Record<string, string>;
    }) {
        try {
            const intent = await this.stripe.paymentIntents.create({
                amount: Math.round(params.amount * 100),
                currency: params.currency.toLowerCase(),
                metadata: {
                    bookingId: params.bookingId,
                    ...params.metadata,
                },
            });

            return {
                clientSecret: intent.client_secret,
                paymentIntentId: intent.id,
            };
        } catch (error) {
            this.logger.error(`Stripe payment intent failed: ${error.message}`);
            throw error;
        }
    }

    async refund(paymentIntentId: string, amount?: number) {
        try {
            const refundParams: Stripe.RefundCreateParams = {
                payment_intent: paymentIntentId,
            };
            if (amount) {
                refundParams.amount = Math.round(amount * 100);
            }

            const refund = await this.stripe.refunds.create(refundParams);
            return {
                refundId: refund.id,
                status: refund.status,
                amount: refund.amount / 100,
            };
        } catch (error) {
            this.logger.error(`Stripe refund failed: ${error.message}`);
            throw error;
        }
    }

    verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
        return this.stripe.webhooks.constructEvent(
            payload,
            signature,
            this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '',
        );
    }
}
