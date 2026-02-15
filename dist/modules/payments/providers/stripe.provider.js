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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var StripeProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
let StripeProvider = StripeProvider_1 = class StripeProvider {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(StripeProvider_1.name);
        this.stripe = new stripe_1.default(this.configService.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2024-12-18.acacia' });
    }
    async createCheckoutSession(params) {
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
                            unit_amount: Math.round(params.amount * 100),
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
                paymentIntentId: session.payment_intent,
            };
        }
        catch (error) {
            this.logger.error(`Stripe session creation failed: ${error.message}`);
            throw error;
        }
    }
    async createPaymentIntent(params) {
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
        }
        catch (error) {
            this.logger.error(`Stripe payment intent failed: ${error.message}`);
            throw error;
        }
    }
    async refund(paymentIntentId, amount) {
        try {
            const refundParams = {
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
        }
        catch (error) {
            this.logger.error(`Stripe refund failed: ${error.message}`);
            throw error;
        }
    }
    verifyWebhookSignature(payload, signature) {
        return this.stripe.webhooks.constructEvent(payload, signature, this.configService.get('STRIPE_WEBHOOK_SECRET') || '');
    }
};
exports.StripeProvider = StripeProvider;
exports.StripeProvider = StripeProvider = StripeProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeProvider);
//# sourceMappingURL=stripe.provider.js.map