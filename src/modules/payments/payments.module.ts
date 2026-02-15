// src/modules/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeProvider } from './providers/stripe.provider';
import { PaystackProvider } from './providers/paystack.provider';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
        BookingsModule,
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService, StripeProvider, PaystackProvider],
    exports: [PaymentsService],
})
export class PaymentsModule { }
