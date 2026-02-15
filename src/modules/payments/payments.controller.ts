// src/modules/payments/payments.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Req,
    Headers,
    RawBodyRequest,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { InitializePaymentDto, RefundPaymentDto } from './dto/payment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/constants/roles.constant';
import { MongoIdValidationPipe } from '../../common/pipes/mongo-id-validation.pipe';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('initialize')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Initialize a payment for a booking' })
    initialize(
        @CurrentUser('_id') userId: string,
        @Body() dto: InitializePaymentDto,
    ) {
        return this.paymentsService.initializePayment(userId, dto);
    }

    @Public()
    @Post('webhook/stripe')
    @ApiOperation({ summary: 'Stripe webhook endpoint' })
    handleStripeWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string,
    ) {
        return this.paymentsService.handleStripeWebhook(req.rawBody!, signature);
    }

    @Public()
    @Post('webhook/paystack')
    @ApiOperation({ summary: 'Paystack webhook endpoint' })
    handlePaystackWebhook(
        @Req() req: Request,
        @Headers('x-paystack-signature') signature: string,
    ) {
        const payload = JSON.stringify(req.body);
        return this.paymentsService.handlePaystackWebhook(payload, signature);
    }

    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get payment by ID' })
    findOne(@Param('id', MongoIdValidationPipe) id: string) {
        return this.paymentsService.findById(id);
    }

    @Get('booking/:bookingId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get payments for a booking' })
    findByBooking(@Param('bookingId', MongoIdValidationPipe) bookingId: string) {
        return this.paymentsService.findByBooking(bookingId);
    }

    @Post(':id/refund')
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
    @ApiOperation({ summary: 'Refund a payment' })
    refund(
        @Param('id', MongoIdValidationPipe) id: string,
        @Body() dto: RefundPaymentDto,
    ) {
        return this.paymentsService.refund(id, dto);
    }
}
