// src/modules/payments/providers/paystack.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaystackProvider {
    private readonly baseUrl = 'https://api.paystack.co';
    private readonly secretKey: string;
    private readonly webhookSecret: string;
    private readonly logger = new Logger(PaystackProvider.name);

    constructor(private configService: ConfigService) {
        this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
        this.webhookSecret = this.configService.get<string>('PAYSTACK_WEBHOOK_SECRET') || '';
    }

    private getHeaders() {
        return {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
        };
    }

    async initializeTransaction(params: {
        amount: number;
        currency: string;
        email: string;
        reference: string;
        callbackUrl?: string;
        metadata?: Record<string, any>;
    }) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/transaction/initialize`,
                {
                    amount: Math.round(params.amount * 100), // Paystack expects kobo/pesewas
                    currency: params.currency.toUpperCase(),
                    email: params.email,
                    reference: params.reference,
                    callback_url: params.callbackUrl,
                    metadata: {
                        custom_fields: [
                            {
                                display_name: 'Booking Reference',
                                variable_name: 'booking_reference',
                                value: params.metadata?.bookingId || '',
                            },
                        ],
                        ...params.metadata,
                    },
                },
                { headers: this.getHeaders() },
            );

            return {
                authorizationUrl: response.data.data.authorization_url,
                accessCode: response.data.data.access_code,
                reference: response.data.data.reference,
            };
        } catch (error) {
            this.logger.error(
                `Paystack initialization failed: ${error.response?.data?.message || error.message}`,
            );
            throw error;
        }
    }

    async verifyTransaction(reference: string) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/transaction/verify/${reference}`,
                { headers: this.getHeaders() },
            );

            return {
                status: response.data.data.status,
                amount: response.data.data.amount / 100,
                currency: response.data.data.currency,
                reference: response.data.data.reference,
                paidAt: response.data.data.paid_at,
                channel: response.data.data.channel,
                metadata: response.data.data.metadata,
            };
        } catch (error) {
            this.logger.error(`Paystack verification failed: ${error.message}`);
            throw error;
        }
    }

    async refund(transactionReference: string, amount?: number) {
        try {
            const body: any = { transaction: transactionReference };
            if (amount) {
                body.amount = Math.round(amount * 100);
            }

            const response = await axios.post(
                `${this.baseUrl}/refund`,
                body,
                { headers: this.getHeaders() },
            );

            return {
                refundId: response.data.data.id,
                status: response.data.data.status,
                amount: response.data.data.amount / 100,
            };
        } catch (error) {
            this.logger.error(`Paystack refund failed: ${error.message}`);
            throw error;
        }
    }

    verifyWebhookSignature(payload: string, signature: string): boolean {
        const hash = crypto
            .createHmac('sha512', this.secretKey)
            .update(payload)
            .digest('hex');
        return hash === signature;
    }
}
