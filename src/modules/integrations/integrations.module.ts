// src/modules/integrations/integrations.module.ts
import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from "../users/users.module";
import { BullModule } from "@nestjs/bull";
import { AirportsModule } from "../airports/airports.module";

// Schemas
import {
  FlightProviderConfig,
  FlightProviderConfigSchema,
} from "./schemas/flight-provider-config.schema";
import { Booking, BookingSchema } from "../bookings/schemas/booking.schema";

// Services
import { FlightsIntegrationService } from "./flights-integration.service";
import { StaysIntegrationService } from "./stays-integration.service";
import { TransfersIntegrationService } from "./transfers-integration.service";
import { ExperiencesIntegrationService } from "./experiences-integration.service";
import { InsuranceIntegrationService } from "./insurance-integration.service";
import { LoungesIntegrationService } from "./lounges-integration.service";
import { AmadeusMarketInsightsService } from "./amadeus-market-insights.service";
import { ProviderConfigService } from "./provider-config.service";
import { CarsIntegrationService } from "./cars-integration.service";
import { DuffelWebhooksService } from "./duffel-webhooks.service";

// Providers
import { AmadeusHelperService } from "./providers/amadeus-helper.service";
import { AmadeusProvider } from "./providers/amadeus.provider";
import { AmadeusHotelsProvider } from "./providers/amadeus-hotels.provider";
import { AmadeusTransfersProvider } from "./providers/amadeus-transfers.provider";
import { AmadeusExperiencesProvider } from "./providers/amadeus-experiences.provider";
import { DuffelProvider } from "./providers/duffel.provider";
import { DuffelStaysProvider } from "./providers/duffel-stays.provider";
import { DuffelCarsProvider } from "./providers/duffel-cars.provider";
import { HotelbedsHelperService } from "./providers/hotelbeds-helper.service";
import { HotelbedsProvider } from "./providers/hotelbeds.provider";
import { HotelbedsTransfersProvider } from "./providers/hotelbeds-transfers.provider";
import { HotelbedsExperiencesProvider } from "./providers/hotelbeds-experiences.provider";
import { ViatorExperiencesProvider } from "./providers/viator-experiences.provider";
import { XCoverInsuranceProvider } from "./providers/xcover-insurance.provider";
import { BookingCarsProvider } from "./providers/booking-cars.provider";
import { PlumLoungesProvider } from "./providers/plum-lounges.provider";
import { TraveltekProvider } from "./providers/traveltek.provider";
import { WelcomePickupsProvider } from "./providers/welcome-pickups.provider";
import { DuffelIdentityService } from "./duffel-identity.service";

// Processors
import { DuffelWebhooksProcessor } from "./duffel-webhooks.processor";

// Controller
import { ProviderConfigController } from "./provider-config.controller";
import { MarketInsightsController } from "./market-insights.controller";
import { DuffelIdentityController } from "./duffel-identity.controller";
import { DuffelWebhooksController } from "./duffel-webhooks.controller";
import { DuffelUtilitiesController } from "./duffel-utilities.controller";

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: "duffel-webhooks-queue",
    }),
    MongooseModule.forFeature([
      {
        name: FlightProviderConfig.name,
        schema: FlightProviderConfigSchema,
      },
      {
        name: Booking.name,
        schema: BookingSchema,
      },
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => AirportsModule),
  ],
  controllers: [
    ProviderConfigController,
    MarketInsightsController,
    DuffelIdentityController,
    DuffelWebhooksController,
    DuffelUtilitiesController,
  ],
  providers: [
    // Config
    ProviderConfigService,

    // Helper
    AmadeusHelperService,
    HotelbedsHelperService,

    // Flight providers
    AmadeusProvider,
    DuffelProvider,
    DuffelIdentityService,

    // Stays providers
    DuffelStaysProvider,
    AmadeusHotelsProvider,
    HotelbedsProvider,

    // Transfer providers
    AmadeusTransfersProvider,
    HotelbedsTransfersProvider,
    WelcomePickupsProvider,

    // Experience providers
    AmadeusExperiencesProvider,
    HotelbedsExperiencesProvider,
    ViatorExperiencesProvider,

    // Insurance providers
    XCoverInsuranceProvider,

    // Cars providers
    DuffelCarsProvider,
    BookingCarsProvider,
    
    // Lounges providers
    PlumLoungesProvider,
    TraveltekProvider,

    // Integration services
    FlightsIntegrationService,
    StaysIntegrationService,
    TransfersIntegrationService,
    ExperiencesIntegrationService,
    InsuranceIntegrationService,
    CarsIntegrationService,
    LoungesIntegrationService,
    AmadeusMarketInsightsService,
    
    // Webhooks
    DuffelWebhooksService,
    DuffelWebhooksProcessor,
  ],
  exports: [
    FlightsIntegrationService,
    StaysIntegrationService,
    TransfersIntegrationService,
    ExperiencesIntegrationService,
    InsuranceIntegrationService,
    CarsIntegrationService,
    LoungesIntegrationService,
    AmadeusMarketInsightsService,
    ProviderConfigService,
    AmadeusHelperService,
    DuffelIdentityService,
    DuffelWebhooksService,
    TraveltekProvider,
    WelcomePickupsProvider,
  ],
})
export class IntegrationsModule {}
