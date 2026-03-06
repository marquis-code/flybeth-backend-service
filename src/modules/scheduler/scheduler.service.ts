// src/modules/scheduler/scheduler.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { BookingsService } from "../bookings/bookings.service";
import { CurrencyService } from "../currency/currency.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private bookingsService: BookingsService,
    private currencyService: CurrencyService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async sendAbandonedReminders() {
    try {
      const bookings = await this.bookingsService.findAbandonedBookings();

      for (const booking of bookings) {
        const user = booking.user as any;
        if (!user?.email) continue;

        let itemName = "your trip";
        let itemType: "flight" | "stay" = "flight";

        if (booking.flights?.length > 0) {
          itemName = `Flight to ${(booking.flights[0] as any).flight?.arrivalAirport?.city || "your destination"}`;
          itemType = "flight";
        } else if (booking.stays?.length > 0) {
          itemName = (booking.stays[0] as any).stay?.name || "the hotel";
          itemType = "stay";
        }

        const clientUrl =
          this.configService.get("CLIENT_URL") || "http://localhost:3000";
        const checkoutUrl = `${clientUrl}/checkout/${booking.pnr}`;

        await this.notificationsService.sendDynamicEmail({
          slug: "payment-reminder",
          to: user.email,
          data: {
            firstName: user.firstName,
            pnr: booking.pnr,
            paymentUrl: checkoutUrl,
          },
          tenantId: booking.tenant?.toString(),
        });

        await this.bookingsService.markReminderSent(booking._id.toString());
        this.logger.log(
          `Abandoned booking reminder sent to ${user.email} for PNR: ${booking.pnr}`,
        );
      }
    } catch (error) {
      this.logger.error(`Abandoned reminder job failed: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async refreshExchangeRates() {
    try {
      await this.currencyService.getExchangeRates("USD");
      this.logger.log("Exchange rates refreshed");
    } catch (error) {
      this.logger.error(`Exchange rate refresh failed: ${error.message}`);
    }
  }
}
