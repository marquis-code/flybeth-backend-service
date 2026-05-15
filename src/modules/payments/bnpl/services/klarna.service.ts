import { Injectable, Logger } from '@nestjs/common';
import { BnplStrategy } from '../bnpl-strategy.interface';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class KlarnaService implements BnplStrategy {
  private readonly logger = new Logger(KlarnaService.name);
  private readonly baseUrl = 'https://api.klarna.com'; // Use sandbox for dev

  async initializePayment(bookingId: string, amount: number, currency: string, metadata?: any) {
    const username = process.env.KLARNA_USERNAME;
    const password = process.env.KLARNA_PASSWORD;

    try {
      // Documentation: https://docs.klarna.com/klarna-payments/api/payments-api/
      const response = await axios.post(`${this.baseUrl}/payments/v1/sessions`, {
        purchase_country: 'US', // Can be parameterized later
        purchase_currency: currency,
        locale: 'en-US',
        order_amount: amount * 100,
        order_lines: [{
          name: `Travel Booking ${bookingId}`,
          quantity: 1,
          unit_price: amount * 100,
          total_amount: amount * 100,
        }],
      }, {
        auth: {
          username: username!,
          password: password!,
        }
      });

      // Klarna returns a client_token for the frontend SDK
      return { 
        checkoutUrl: 'klarna_sdk', // Signal frontend to use SDK
        reference: response.data.client_token 
      };
    } catch (error) {
      this.logger.error(`Klarna initialization failed: ${error.response?.data?.message || error.message}`);
      return { 
        checkoutUrl: 'error', 
        reference: `kl_mock_${bookingId}` 
      };
    }
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    const signingSecret = process.env.KLARNA_SIGNING_SECRET || 'test_secret';
    const computedHash = crypto
      .createHmac('sha256', signingSecret)
      .update(JSON.stringify(payload))
      .digest('base64');

    return computedHash === signature;
  }

  async authorizePayment(authorizationToken: string, bookingId: string, amount: number, currency: string): Promise<boolean> {
    const username = process.env.KLARNA_USERNAME;
    const password = process.env.KLARNA_PASSWORD;
    
    try {
      // 3. Create an Order: POST /payments/v1/authorizations/{authorizationToken}/order
      const response = await axios.post(`${this.baseUrl}/payments/v1/authorizations/${authorizationToken}/order`, {
        purchase_country: 'US',
        purchase_currency: currency,
        locale: 'en-US',
        order_amount: amount * 100,
        order_lines: [{
          name: `Travel Booking ${bookingId}`,
          quantity: 1,
          unit_price: amount * 100,
          total_amount: amount * 100,
        }]
      }, {
        auth: {
          username: username!,
          password: password!,
        }
      });

      return !!response.data.order_id;
    } catch (error) {
      this.logger.error(`Klarna authorization/order creation failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}
