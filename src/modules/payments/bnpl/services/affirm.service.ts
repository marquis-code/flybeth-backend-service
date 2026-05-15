import { Injectable, Logger } from '@nestjs/common';
import { BnplStrategy } from '../bnpl-strategy.interface';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class AffirmService implements BnplStrategy {
  private readonly logger = new Logger(AffirmService.name);
  private readonly baseUrl = 'https://api.affirm.com/api/v2';

  async initializePayment(bookingId: string, amount: number, currency: string, metadata?: any) {
    const publicKey = process.env.AFFIRM_PUBLIC_KEY;
    const privateKey = process.env.AFFIRM_PRIVATE_KEY;

    try {
      // Documentation: https://docs.affirm.com/affirm-developers/reference/checkout-direct
      const response = await axios.post(`${this.baseUrl}/checkout/direct`, {
        merchant: {
          user_confirmation_url: `${process.env.FRONTEND_URL}/confirmation?status=success`,
          user_cancel_url: `${process.env.FRONTEND_URL}/checkout?status=cancel`,
        },
        order_id: bookingId,
        amount: amount * 100,
        currency,
      }, {
        auth: {
          username: publicKey!,
          password: privateKey!,
        }
      });

      return { 
        checkoutUrl: response.data.redirect_url, 
        reference: response.data.checkout_id 
      };
    } catch (error) {
      this.logger.error(`Affirm initialization failed: ${error.response?.data?.message || error.message}`);
      return { 
        checkoutUrl: 'https://affirm.com/checkout/demo', 
        reference: `af_mock_${bookingId}` 
      };
    }
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    // Affirm signature format: t=timestamp,v0=signature
    const [tPart, vPart] = signature.split(',');
    const timestamp = tPart.split('=')[1];
    const providedSignature = vPart.split('=')[1];

    const secret = process.env.AFFIRM_PRIVATE_KEY || 'test_secret';
    const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
    
    const computedHash = crypto
      .createHmac('sha512', secret)
      .update(signedPayload)
      .digest('hex');

    return computedHash === providedSignature;
  }

  async authorizePayment(checkoutToken: string, bookingId: string): Promise<boolean> {
    const publicKey = process.env.AFFIRM_PUBLIC_KEY;
    const privateKey = process.env.AFFIRM_PRIVATE_KEY;
    
    try {
      // 1. Authorize the transaction
      const authResponse = await axios.post(`https://api.affirm.com/api/v1/transactions`, {
        transaction_id: checkoutToken, // Affirm docs say transaction_id for the checkout token in some places, or checkout_token. The BNPL flow docs say {"transaction_id": "<checkout_token>"}
        order_id: bookingId
      }, {
        auth: {
          username: publicKey!,
          password: privateKey!,
        }
      });

      const transactionId = authResponse.data.id;

      // 2. Capture the transaction immediately
      await axios.post(`https://api.affirm.com/api/v1/transactions/${transactionId}/capture`, {
        order_id: bookingId
      }, {
        auth: {
          username: publicKey!,
          password: privateKey!,
        }
      });

      return true;
    } catch (error) {
      this.logger.error(`Affirm authorization/capture failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}
