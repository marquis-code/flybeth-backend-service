import { Controller, Post, Body, Headers, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { DuffelWebhookGuard } from './guards/duffel-webhook.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('webhooks')
@Controller('webhooks/duffel')
export class DuffelWebhookController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Post()
  @UseGuards(DuffelWebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle incoming webhooks from Duffel' })
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-duffel-signature') signature: string,
  ) {
    await this.bookingsService.handleWebhookEvent(payload);
    return { received: true };
  }
}
