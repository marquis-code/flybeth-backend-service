// src/modules/bookings/bookings.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";
import { Booking, BookingSchema } from "./schemas/booking.schema";
import { FlightsModule } from "../flights/flights.module";
import { TenantsModule } from "../tenants/tenants.module";
import { StaysModule } from "../stays/stays.module";
import { CarsModule } from "../cars/cars.module";
import { CruisesModule } from "../cruises/cruises.module";
import { PackagesModule } from "../packages/packages.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { FraudModule } from "../fraud/fraud.module";
import { IntegrationsModule } from "../integrations/integrations.module";
import { PassengersModule } from "../passengers/passengers.module";
import { FinanceModule } from "../finance/finance.module";
import { SystemConfigModule } from "../system-config/system-config.module";

import { InvoiceService } from "./invoice.service";
import { OrderFulfillmentService } from "./order-fulfillment.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
    FlightsModule,
    TenantsModule,
    StaysModule,
    CarsModule,
    CruisesModule,
    PackagesModule,
    NotificationsModule,
    FraudModule,
    IntegrationsModule,
    PassengersModule,
    FinanceModule,
    SystemConfigModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, InvoiceService, OrderFulfillmentService],
  exports: [BookingsService, OrderFulfillmentService],
})
export class BookingsModule {}
