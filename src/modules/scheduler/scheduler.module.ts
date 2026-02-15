// src/modules/scheduler/scheduler.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { BookingsModule } from '../bookings/bookings.module';
import { CurrencyModule } from '../currency/currency.module';

@Module({
    imports: [ScheduleModule.forRoot(), BookingsModule, CurrencyModule],
    providers: [SchedulerService],
})
export class SchedulerModule { }
