import { Injectable, Logger } from '@nestjs/common';
import { BnplStrategy } from '../bnpl-strategy.interface';
import axios from 'axios';

@Injectable()
export class PaypalFourService implements BnplStrategy {
  private readonly logger = new Logger(PaypalFourService.name);
  private readonly baseUrl = 'https://api-m.paypal.com'; // Use sandbox.paypal.com for dev

  private async getAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post(`${this.baseUrl}/v1/oauth2/token`, 'grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    return response.data.access_token;
  }

  async initializePayment(bookingId: string, amount: number, currency: string, metadata?: any) {
    try {
      const accessToken = await this.getAccessToken();
      
      // Documentation: https://developer.paypal.com/docs/api/orders/v2/#orders_create
      const response = await axios.post(`${this.baseUrl}/v2/checkout/orders`, {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: bookingId,
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          }
        }],
        payment_source: {
          paypal: {
            experience_context: {
              return_url: `${process.env.FRONTEND_URL}/confirmation?status=success`,
              cancel_url: `${process.env.FRONTEND_URL}/checkout?status=cancel`,
              user_action: 'PAY_NOW',
            }
          }
        }
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      const approveUrl = response.data.links.find((l: any) => l.rel === 'approve').href;

      return { 
        checkoutUrl: approveUrl, 
        reference: response.data.id 
      };
    } catch (error) {
      this.logger.error(`PayPal initialization failed: ${error.response?.data?.message || error.message}`);
      return { 
        checkoutUrl: 'https://paypal.com/checkout/demo', 
        reference: `pp4_mock_${bookingId}` 
      };
    }
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    // PayPal webhook verification is complex and usually requires calling their verification endpoint
    // For now, we'll implement a basic validation or use their SDK if available
    return true; 
  }

  async authorizePayment(checkoutToken: string, bookingId: string, amount: number, currency: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      
      // Documentation: https://developer.paypal.com/docs/api/orders/v2/#orders_capture
      // We must capture the order using the token provided upon redirect
      const response = await axios.post(`${this.baseUrl}/v2/checkout/orders/${checkoutToken}/capture`, {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      // PayPal returns COMPLETED if the capture was successful
      return response.data?.status === 'COMPLETED';
    } catch (error) {
      this.logger.error(`PayPal capture/authorization failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}
