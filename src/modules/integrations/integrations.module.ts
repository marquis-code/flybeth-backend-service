// src/modules/integrations/integrations.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Providers
import { AmadeusProvider } from './providers/amadeus.provider';
import { AmadeusExperiencesProvider } from './providers/amadeus-experiences.provider';
import { AmadeusTransfersProvider } from './providers/amadeus-transfers.provider';
import { AmadeusInsightsProvider } from './providers/amadeus-insights.provider';
import { AmadeusHotelsProvider } from './providers/amadeus-hotels.provider';
import { AmadeusItineraryProvider } from './providers/amadeus-itinerary.provider';

// Services
import { FlightsIntegrationService } from './flights-integration.service';

// Controllers
import { AmadeusExperiencesController } from './controllers/amadeus-experiences.controller';
import { AmadeusTransfersController } from './controllers/amadeus-transfers.controller';
import { AmadeusInsightsController } from './controllers/amadeus-insights.controller';
import { AmadeusHotelsController } from './controllers/amadeus-hotels.controller';
import { AmadeusItineraryController } from './controllers/amadeus-itinerary.controller';

@Module({
    imports: [ConfigModule],
    controllers: [
        AmadeusExperiencesController,
        AmadeusTransfersController,
        AmadeusInsightsController,
        AmadeusHotelsController,
        AmadeusItineraryController,
    ],
    providers: [
        // Core flight provider + integration service
        AmadeusProvider,
        FlightsIntegrationService,
        // Category providers
        AmadeusExperiencesProvider,
        AmadeusTransfersProvider,
        AmadeusInsightsProvider,
        AmadeusHotelsProvider,
        AmadeusItineraryProvider,
    ],
    exports: [
        FlightsIntegrationService,
        AmadeusExperiencesProvider,
        AmadeusTransfersProvider,
        AmadeusInsightsProvider,
        AmadeusHotelsProvider,
        AmadeusItineraryProvider,
    ],
})
export class IntegrationsModule { }
