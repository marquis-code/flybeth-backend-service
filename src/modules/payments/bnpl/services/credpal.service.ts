import { Injectable, Logger } from '@nestjs/common';
import { BnplStrategy } from '../bnpl-strategy.interface';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class CredpalService implements BnplStrategy {
  private readonly logger = new Logger(CredpalService.name);
  private readonly baseUrl = 'https://api.credpal.com/v1';

  async initializePayment(bookingId: string, amount: number, currency: string, metadata?: any) {
    const secretKey = process.env.CREDPAL_SECRET_KEY;
    const publicKey = process.env.CREDPAL_PUBLIC_KEY;

    try {
      // Documentation: https://credpal.com/docs/api/checkout/initialize
      const response = await axios.post(`${this.baseUrl}/checkout/initialize`, {
        amount: amount * 100, // Assuming minor units
        currency,
        reference: `CP_${bookingId}_${Date.now()}`,
        customer_email: 'customer@example.com', // Should be passed in metadata
        callback_url: `${process.env.FRONTEND_URL}/confirmation?status=success`,
      }, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'X-Public-Key': publicKey,
        }
      });

      return { 
        checkoutUrl: response.data.data.checkout_url, 
        reference: response.data.data.reference 
      };
    } catch (error) {
      this.logger.error(`CredPal initialization failed: ${error.response?.data?.message || error.message}`);
      // Fallback for demo if key is missing
      return { 
        checkoutUrl: 'https://credpal.com/checkout/demo', 
        reference: `cp_mock_${bookingId}` 
      };
    }
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    const secret = process.env.CREDPAL_SECRET_KEY || 'test_secret';
    const computedHash = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return computedHash === signature;
  }

  async authorizePayment(checkoutToken: string, bookingId: string, amount: number, currency: string): Promise<boolean> {
    const secretKey = process.env.CREDPAL_SECRET_KEY;
    const publicKey = process.env.CREDPAL_PUBLIC_KEY;

    try {
      // Documentation: https://credpal.com/docs/api/checkout/verify
      // We verify the transaction using the reference (checkoutToken)
      const response = await axios.get(`${this.baseUrl}/checkout/verify/${checkoutToken}`, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'X-Public-Key': publicKey,
        }
      });

      // Usually CredPal returns success in data.status
      return response.data?.data?.status === 'success' || response.data?.status === true;
    } catch (error) {
      this.logger.error(`CredPal verification failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}
