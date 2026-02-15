import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { InitializePaymentDto, RefundPaymentDto } from './dto/payment.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    initialize(userId: string, dto: InitializePaymentDto): Promise<any>;
    handleStripeWebhook(req: RawBodyRequest<Request>, signature: string): Promise<{
        received: boolean;
    }>;
    handlePaystackWebhook(req: Request, signature: string): Promise<{
        received: boolean;
    }>;
    findOne(id: string): Promise<import("./schemas/payment.schema").PaymentDocument>;
    findByBooking(bookingId: string): Promise<import("./schemas/payment.schema").PaymentDocument[]>;
    refund(id: string, dto: RefundPaymentDto): Promise<any>;
}
