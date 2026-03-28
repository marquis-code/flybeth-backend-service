// src/modules/scheduler/scheduler.module.ts
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { SchedulerService } from "./scheduler.service";
import { BookingsModule } from "../bookings/bookings.module";
import { CurrencyModule } from "../currency/currency.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BookingsModule,
    CurrencyModule,
    NotificationsModule,
    UsersModule,
  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
