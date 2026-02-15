// src/modules/scheduler/scheduler.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingsService } from '../bookings/bookings.service';
import { CurrencyService } from '../currency/currency.service';

@Injectable()
export class SchedulerService {
    private readonly logger = new Logger(SchedulerService.name);

    constructor(
        private bookingsService: BookingsService,
        private currencyService: CurrencyService,
    ) { }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async expirePendingBookings() {
        try {
            const expired = await this.bookingsService.expireBookings();
            if (expired > 0) {
                this.logger.log(`Expired ${expired} pending bookings`);
            }
        } catch (error) {
            this.logger.error(`Booking expiry job failed: ${error.message}`);
        }
    }

    @Cron(CronExpression.EVERY_HOUR)
    async refreshExchangeRates() {
        try {
            await this.currencyService.getExchangeRates('USD');
            this.logger.log('Exchange rates refreshed');
        } catch (error) {
            this.logger.error(`Exchange rate refresh failed: ${error.message}`);
        }
    }
}
