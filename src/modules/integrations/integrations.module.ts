// src/modules/integrations/integrations.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";

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
import { SabreHelperService } from "./providers/sabre-helper.service";
import { SabreCarsProvider } from "./providers/sabre-cars.provider";

// Controller
import { ProviderConfigController } from "./provider-config.controller";
import { MarketInsightsController } from "./market-insights.controller";

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: FlightProviderConfig.name,
        schema: FlightProviderConfigSchema,
      },
    ]),
  ],
  controllers: [ProviderConfigController, MarketInsightsController],
  providers: [
    // Config
    ProviderConfigService,

    // Helper
    AmadeusHelperService,
    HotelbedsHelperService,
    SabreHelperService,

    // Flight providers
    AmadeusProvider,
    DuffelProvider,

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

    // Car providers
    SabreCarsProvider,

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
  ],
})
export class IntegrationsModule { }
