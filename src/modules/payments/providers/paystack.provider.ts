import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import * as crypto from "crypto";
import * as https from "https";

@Injectable()
export class PaystackProvider {
  private readonly baseUrl = "https://api.paystack.co";
  private readonly secretKey: string;
  private readonly webhookSecret: string;
  private readonly logger = new Logger(PaystackProvider.name);
  private readonly httpsAgent: https.Agent;

  constructor(private configService: ConfigService) {
    this.secretKey =
      this.configService.get<string>("PAYSTACK_SECRET_KEY") || "";
    this.webhookSecret =
      this.configService.get<string>("PAYSTACK_WEBHOOK_SECRET") || "";

    this.httpsAgent = new https.Agent({
      minVersion: "TLSv1.2",
      keepAlive: true,
    });
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      "Content-Type": "application/json",
    };
  }

  async initializeTransaction(params: {
    amount: number;
    currency?: string;
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
          currency: (params.currency || "NGN").toUpperCase(),
          email: params.email,
          reference: params.reference,
          callback_url: params.callbackUrl,
          metadata: {
            ...params.metadata,
          },
        },
        {
          headers: this.getHeaders(),
          httpsAgent: this.httpsAgent,
        },
      );

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      this.logger.error(`Paystack initialization failed: ${errorMessage}`);
      throw new InternalServerErrorException(
        errorMessage || "Paystack initialization failed",
      );
    }
  }

  async verifyTransaction(reference: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: this.getHeaders(),
          httpsAgent: this.httpsAgent,
        },
      );

      const data = response.data.data;
      return {
        status: data.status === "success" ? "success" : "failed",
        amount: data.amount / 100,
        currency: data.currency,
        reference: data.reference,
        paidAt: data.paid_at,
        data,
      };
    } catch (error: any) {
      this.logger.error(`Paystack verification failed: ${error.message}`);
      throw new InternalServerErrorException(
        error.response?.data?.message || "Paystack verification failed",
      );
    }
  }

  async refund(transactionReference: string, amount?: number) {
    try {
      const body: any = { transaction: transactionReference };
      if (amount) {
        body.amount = Math.round(amount * 100);
      }

      const response = await axios.post(`${this.baseUrl}/refund`, body, {
        headers: this.getHeaders(),
        httpsAgent: this.httpsAgent,
      });

      return {
        refundId: response.data.data.id,
        status: response.data.data.status,
        amount: response.data.data.amount / 100,
      };
    } catch (error: any) {
      this.logger.error(`Paystack refund failed: ${error.message}`);
      throw new InternalServerErrorException(
        error.response?.data?.message || "Paystack refund failed",
      );
    }
  }

  async getBanks() {
    try {
      const response = await axios.get(`${this.baseUrl}/bank`, {
        headers: this.getHeaders(),
        httpsAgent: this.httpsAgent,
        params: {
          country: "nigeria",
          perPage: 100,
        },
      });
      return response.data.data || [];
    } catch (error: any) {
      this.logger.error(`Failed to fetch banks: ${error.message}`);
      return [];
    }
  }

  async resolveAccount(account_number: string, bank_code: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/bank/resolve`, {
        headers: this.getHeaders(),
        httpsAgent: this.httpsAgent,
        params: {
          account_number,
          bank_code,
        },
      } as any);

      return (response.data as any)?.data || {};
    } catch (error: any) {
      this.logger.error(
        "Paystack Resolve Account Error:",
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        error.response?.data?.message || "Account resolution failed",
      );
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac("sha512", this.secretKey)
      .update(payload)
      .digest("hex");
    return hash === signature;
  }
}
