import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class DuffelWebhookGuard implements CanActivate {
  private readonly logger = new Logger(DuffelWebhookGuard.name);

  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-duffel-signature'];
    const secret = this.configService.get<string>('DUFFEL_WEBHOOK_SECRET');

    if (!signature) {
      throw new UnauthorizedException('Missing Duffel signature');
    }

    if (!secret) {
      this.logger.error('DUFFEL_WEBHOOK_SECRET is not configured');
      throw new UnauthorizedException('Webhook configuration error');
    }

    const payload = JSON.stringify(request.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid Duffel webhook signature');
    }

    return true;
  }
}
