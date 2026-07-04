// src/modules/scheduler/scheduler.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { BookingsService } from "../bookings/bookings.service";
import { CurrencyService } from "../currency/currency.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ResendService } from "../notifications/resend.service";
import { UsersService } from "../users/users.service";
import { ConfigService } from "@nestjs/config";
import { MarketingService } from "../marketing/marketing.service";
import { FlightsService } from "../flights/flights.service";

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private bookingsService: BookingsService,
    private currencyService: CurrencyService,
    private notificationsService: NotificationsService,
    private resendService: ResendService,
    private usersService: UsersService,
    private configService: ConfigService,
    private marketingService: MarketingService,
    private flightsService: FlightsService,
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

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendUserReminders() {
    try {
      this.logger.log("Starting daily user engagement reminders...");

      const usersResponse = await this.usersService.findAll({
        role: "customer",
      } as any);
      const users = usersResponse.data;

      for (const user of users) {
        // Send a friendly reminder to book a service
        await this.notificationsService.sendEmail(
          user.email,
          "Ready for your next adventure? ✈️",
          this.resendService.brandWrapper(
            "We miss you, " + user.firstName + "!",
            `<p>It's been a while since your last search. The world is waiting for you!</p>
             <p>Check out our latest flight deals and book your next trip today.</p>
             <div style="margin: 30px 0; text-align: center;">
               <a href="${this.configService.get("CLIENT_URL") || "http://localhost:3000"}/search" 
                  style="background: #0D1DAD; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                 Explore Flights
               </a>
             </div>`,
          ),
        );
      }

      this.logger.log(`Sent engagement reminders to ${users.length} users`);
    } catch (error) {
      this.logger.error(`User reminder job failed: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendCheapFlightsNewsletter() {
    try {
      this.logger.log("Starting cheap flights newsletter job...");
      
      const subscribers = await this.marketingService.getActiveSubscribers();
      if (!subscribers.length) {
        this.logger.log("No active newsletter subscribers found. Skipping.");
        return;
      }

      const deals = await this.flightsService.getDeals(5); // Get top 5 deals
      
      if (!deals.length) {
        this.logger.log("No flight deals available to send today.");
        return;
      }

      // Generate HTML for deals
      let dealsHtml = '<div style="display:flex;flex-direction:column;gap:20px;">';
      for (const deal of deals) {
        dealsHtml += `
          <div style="border:1px solid #e0e0e0; border-radius:10px; padding:15px; margin-bottom:15px;">
            <h3 style="margin:0 0 10px 0;">${deal.origin?.city || 'Anywhere'} ✈️ ${deal.destination?.city || 'Anywhere'}</h3>
            <p style="margin:0; font-size: 18px;">From <strong>$${deal.price?.amount || 0}</strong></p>
            <p style="margin:5px 0 0 0; color:#666;">Airline: ${deal.airline?.name || 'Various'}</p>
          </div>
        `;
      }
      dealsHtml += '</div>';

      const clientUrl = this.configService.get("CLIENT_URL") || "http://localhost:3000";
      
      const emailContent = this.resendService.brandWrapper(
        "Today's Top Flight Deals!",
        `<p>Hello Explorer,</p>
         <p>As promised, here are the absolute cheapest flight deals we found today. Grab them before they're gone!</p>
         ${dealsHtml}
         <div style="margin: 30px 0; text-align: center;">
           <a href="${clientUrl}/search" 
              style="background: #0D1DAD; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
             Search All Flights
           </a>
         </div>
         <p style="font-size: 12px; color: #999; text-align: center; margin-top: 40px;">
            You are receiving this email because you subscribed to Flybeth Flight Deals.
         </p>`
      );

      for (const subscriber of subscribers) {
        try {
          await this.notificationsService.sendEmail(
            subscriber.email,
            "🔥 Top Secret: Today's Cheapest Flights",
            emailContent
          );
        } catch (e) {
          this.logger.error(`Failed to send newsletter to ${subscriber.email}: ${e.message}`);
        }
      }

      this.logger.log(`Sent cheap flights newsletter to ${subscribers.length} subscribers`);
    } catch (error) {
      this.logger.error(`Cheap flights newsletter job failed: ${error.message}`);
    }
  }
}
