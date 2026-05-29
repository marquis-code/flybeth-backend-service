import { Injectable } from '@nestjs/common';
import { BnplStrategy } from '../bnpl-strategy.interface';
import { generateReference } from '../../../../common/utils/crypto.util';

@Injectable()
export class SezzleService implements BnplStrategy {
  async initializePayment(bookingId: string, amount: number, currency: string, metadata?: any) {
    return {
      checkoutUrl: `https://checkout.sezzle.com/?amount=${amount}&ref=${bookingId}`,
      reference: generateReference()
    };
  }
  async verifyWebhook(payload: any, signature: string) { return true; }
}
