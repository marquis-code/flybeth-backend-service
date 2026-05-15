import { Injectable, BadRequestException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { BnplStrategy } from './bnpl-strategy.interface';
import { CredpalService } from './services/credpal.service';
import { AffirmService } from './services/affirm.service';
import { KlarnaService } from './services/klarna.service';
import { PaypalFourService } from './services/paypal-four.service';
import { PaymentProvider } from '../../../common/constants/roles.constant';

@Injectable()
export class BnplFactory {
  constructor(private moduleRef: ModuleRef) {}

  getStrategy(gateway: PaymentProvider): BnplStrategy {
    switch (gateway) {
      case PaymentProvider.CREDPAL:
        return this.moduleRef.get(CredpalService);
      case PaymentProvider.AFFIRM:
        return this.moduleRef.get(AffirmService);
      case PaymentProvider.KLARNA:
        return this.moduleRef.get(KlarnaService);
      case PaymentProvider.PAYPAL_FOUR:
        return this.moduleRef.get(PaypalFourService);
      default:
        throw new BadRequestException(`Unsupported BNPL Gateway: ${gateway}`);
    }
  }
}
