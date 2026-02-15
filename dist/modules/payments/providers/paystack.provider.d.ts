import { ConfigService } from '@nestjs/config';
export declare class PaystackProvider {
    private configService;
    private readonly baseUrl;
    private readonly secretKey;
    private readonly webhookSecret;
    private readonly logger;
    constructor(configService: ConfigService);
    private getHeaders;
    initializeTransaction(params: {
        amount: number;
        currency: string;
        email: string;
        reference: string;
        callbackUrl?: string;
        metadata?: Record<string, any>;
    }): Promise<{
        authorizationUrl: any;
        accessCode: any;
        reference: any;
    }>;
    verifyTransaction(reference: string): Promise<{
        status: any;
        amount: number;
        currency: any;
        reference: any;
        paidAt: any;
        channel: any;
        metadata: any;
    }>;
    refund(transactionReference: string, amount?: number): Promise<{
        refundId: any;
        status: any;
        amount: number;
    }>;
    verifyWebhookSignature(payload: string, signature: string): boolean;
}
