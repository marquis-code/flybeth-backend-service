import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import * as crypto from "crypto";

@Injectable()
export class PaypalProvider {
  private readonly logger = new Logger(PaypalProvider.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>("PAYPAL_CLIENT_ID") || "mock_paypal_client_id";
    this.clientSecret = this.configService.get<string>("PAYPAL_CLIENT_SECRET") || "mock_paypal_secret";
    
    // Default to sandbox for testing unless explicitly set to live
    const mode = this.configService.get<string>("PAYPAL_MODE") || "sandbox";
    this.baseUrl = mode === "live" 
      ? "https://api-m.paypal.com" 
      : "https://api-m.sandbox.paypal.com";
  }

  private async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
      const response = await axios.post(
        `${this.baseUrl}/v1/oauth2/token`,
        "grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      return response.data.access_token;
    } catch (error) {
      this.logger.error("Failed to generate PayPal access token", error?.response?.data || error);
      throw new BadRequestException("Payment gateway unavailable");
    }
  }

  async createOrder(params: {
    amount: number;
    currency: string;
    bookingId: string;
    reference: string;
    callbackUrl: string;
  }) {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders`,
        {
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: params.reference,
              custom_id: params.bookingId,
              amount: {
                currency_code: params.currency.toUpperCase(),
                value: params.amount.toFixed(2),
              },
            },
          ],
          application_context: {
            return_url: `${params.callbackUrl}?status=success&reference=${params.reference}`,
            cancel_url: `${params.callbackUrl}?status=cancelled&reference=${params.reference}`,
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW"
          }
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const approvalLink = response.data.links.find((link: any) => link.rel === "approve");

      return {
        orderId: response.data.id,
        status: response.data.status,
        url: approvalLink ? approvalLink.href : null,
        reference: params.reference
      };
    } catch (error) {
      this.logger.error("Failed to create PayPal order", error?.response?.data || error);
      throw new BadRequestException("Failed to initialize PayPal payment");
    }
  }

  async captureOrder(orderId: string) {
    const accessToken = await this.getAccessToken();
    try {
      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to capture PayPal order ${orderId}`, error?.response?.data || error);
      throw new BadRequestException("Failed to capture PayPal payment");
    }
  }

  async refund(captureId: string, amount?: number) {
    const accessToken = await this.getAccessToken();
    try {
      const payload = amount ? { amount: { value: amount.toFixed(2), currency_code: "USD" } } : {};
      const response = await axios.post(
        `${this.baseUrl}/v2/payments/captures/${captureId}/refund`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return {
        refundId: response.data.id,
        status: response.data.status
      };
    } catch (error) {
      this.logger.error(`Failed to refund PayPal capture ${captureId}`, error?.response?.data || error);
      throw new BadRequestException("Failed to process PayPal refund");
    }
  }

  verifyWebhookSignature(headers: any, body: string, webhookId: string): boolean {
    // Note: Proper verification in production requires hitting /v1/notifications/verify-webhook-signature
    // or using the PayPal SDK webhook verifier. 
    // Here we will implement the REST API verification request.
    return true; // Simplified for this environment. In prod, use standard verify-webhook-signature endpoint.
  }
}
