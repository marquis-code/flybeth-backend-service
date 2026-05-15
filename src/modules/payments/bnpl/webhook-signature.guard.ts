import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PaymentProvider } from '../../../common/constants/roles.constant';
import { BnplFactory } from './bnpl.factory';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  constructor(private bnplFactory: BnplFactory) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const gateway = request.params.gateway as PaymentProvider;
    
    const strategy = this.bnplFactory.getStrategy(gateway);
    if (!strategy) return true;

    const signature = 
      request.headers['x-credpal-signature'] || 
      request.headers['x-affirm-signature'] || 
      request.headers['klarna-signature'] || 
      request.headers['x-paypal-signature'];

    if (!signature) {
      // Some providers might not send signatures in dev, but for production it's critical
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException(`Missing signature for ${gateway} webhook`);
      }
      return true;
    }

    const isValid = await strategy.verifyWebhook(request.body, signature as string);
    
    if (!isValid) {
      throw new UnauthorizedException(`Invalid signature for ${gateway} webhook`);
    }

    return true;
  }
}
