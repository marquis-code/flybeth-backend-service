// src/modules/analytics/analytics.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Booking.name, schema: BookingSchema },
            { name: Payment.name, schema: PaymentSchema },
        ]),
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
})
export class AnalyticsModule { }
