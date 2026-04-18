// src/modules/integrations/integrations.module.ts
import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from "../users/users.module";

// Schemas
import {
  FlightProviderConfig,
  FlightProviderConfigSchema,
} from "./schemas/flight-provider-config.schema";

// Services
import { FlightsIntegrationService } from "./flights-integration.service";
import { StaysIntegrationService } from "./stays-integration.service";
import { TransfersIntegrationService } from "./transfers-integration.service";
import { ExperiencesIntegrationService } from "./experiences-integration.service";
import { AmadeusMarketInsightsService } from "./amadeus-market-insights.service";
import { ProviderConfigService } from "./provider-config.service";
import { CarsIntegrationService } from "./cars-integration.service";

// Providers
import { AmadeusHelperService } from "./providers/amadeus-helper.service";
import { AmadeusProvider } from "./providers/amadeus.provider";
import { AmadeusHotelsProvider } from "./providers/amadeus-hotels.provider";
import { AmadeusTransfersProvider } from "./providers/amadeus-transfers.provider";
import { AmadeusExperiencesProvider } from "./providers/amadeus-experiences.provider";
import { DuffelProvider } from "./providers/duffel.provider";
import { DuffelStaysProvider } from "./providers/duffel-stays.provider";
import { HotelbedsHelperService } from "./providers/hotelbeds-helper.service";
import { HotelbedsProvider } from "./providers/hotelbeds.provider";
import { HotelbedsTransfersProvider } from "./providers/hotelbeds-transfers.provider";
import { HotelbedsExperiencesProvider } from "./providers/hotelbeds-experiences.provider";
import { DuffelIdentityService } from "./duffel-identity.service";
// Controller
import { ProviderConfigController } from "./provider-config.controller";
import { MarketInsightsController } from "./market-insights.controller";
import { DuffelIdentityController } from "./duffel-identity.controller";

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: FlightProviderConfig.name,
        schema: FlightProviderConfigSchema,
      },
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [ProviderConfigController, MarketInsightsController, DuffelIdentityController],
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

    // Experience providers
    AmadeusExperiencesProvider,
    HotelbedsExperiencesProvider,

    // Integration services
    FlightsIntegrationService,
    StaysIntegrationService,
    TransfersIntegrationService,
    ExperiencesIntegrationService,
    CarsIntegrationService,
    AmadeusMarketInsightsService,
  ],
  exports: [
    FlightsIntegrationService,
    StaysIntegrationService,
    TransfersIntegrationService,
    ExperiencesIntegrationService,
    CarsIntegrationService,
    AmadeusMarketInsightsService,
    ProviderConfigService,
    AmadeusHelperService,
    DuffelIdentityService,
  ],
})
export class IntegrationsModule {}
