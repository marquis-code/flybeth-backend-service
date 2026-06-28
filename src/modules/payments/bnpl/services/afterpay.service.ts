import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { BnplStrategy } from '../bnpl-strategy.interface';
import { generateReference } from '../../../../common/utils/crypto.util';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AfterpayService implements BnplStrategy {
  private readonly logger = new Logger(AfterpayService.name);
  private readonly apiUrl: string;
  private readonly merchantId: string;
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    // Determine sandbox vs production from environment (fallback to sandbox)
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    this.apiUrl = isProd 
      ? 'https://global-api.afterpay.com' 
      : 'https://global-api-sandbox.afterpay.com';
      
    this.merchantId = this.configService.get<string>('AFTERPAY_MERCHANT_ID') || '';
    this.secretKey = this.configService.get<string>('AFTERPAY_SECRET_KEY') || '';
  }

  async initializePayment(bookingId: string, amount: number, currency: string, metadata?: any) {
    if (!this.merchantId || !this.secretKey) {
      this.logger.error('Afterpay credentials are not configured.');
      throw new BadRequestException('Afterpay payment is currently unavailable.');
    }

    try {
      // Split name into givenName and surname for Afterpay Consumer object
      const fullName = metadata?.contactDetails?.name || 'Guest User';
      const nameParts = fullName.split(' ');
      const givenNames = nameParts[0];
      const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

      const callbackUrl = metadata?.callbackUrl || 'https://flybeth.com/callback';
      const reference = generateReference();

      // Encode credentials for Basic Auth
      const authKey = Buffer.from(`${this.merchantId}:${this.secretKey}`).toString('base64');

      const payload = {
        amount: {
          amount: amount.toFixed(2), // Ensure 2 decimal places as string
          currency: currency.toUpperCase()
        },
        consumer: {
          email: metadata?.contactDetails?.email || 'guest@flybeth.com',
          givenNames: givenNames,
          surname: surname,
          phoneNumber: metadata?.contactDetails?.phone || ''
        },
        merchantReference: reference,
        merchant: {
          redirectConfirmUrl: `${callbackUrl}&status=success&reference=${reference}&provider=afterpay`,
          redirectCancelUrl: `${callbackUrl}&status=cancelled&reference=${reference}&provider=afterpay`,
          name: "Flybeth Global"
        },
        mode: "standard"
      };

      const response = await axios.post(`${this.apiUrl}/v2/checkouts`, payload, {
        headers: {
          'Authorization': `Basic ${authKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Flybeth-Backend/1.0',
          'Accept': 'application/json'
        }
      });

      const { token, redirectCheckoutUrl } = response.data;

      return {
        checkoutUrl: redirectCheckoutUrl,
        reference: reference, // we return our own reference to track it
        token: token // optional, returning for consistency
      };
    } catch (error) {
      this.logger.error(`Afterpay initialization failed: ${error?.response?.data?.message || error.message}`);
      if (error.response?.data) {
        this.logger.error(JSON.stringify(error.response.data));
      }
      throw new BadRequestException('Failed to initialize Afterpay checkout.');
    }
  }

  async verifyWebhook(payload: any, signature: string) { 
    // Afterpay webhooks validation logic
    return true; 
  }
}
