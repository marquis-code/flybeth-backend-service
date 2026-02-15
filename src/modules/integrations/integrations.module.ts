// src/modules/integrations/integrations.module.ts
import { Module } from '@nestjs/common';
import { FlightsIntegrationService } from './flights-integration.service';
import { AmadeusProvider } from './providers/amadeus.provider';

@Module({
    providers: [FlightsIntegrationService, AmadeusProvider],
    exports: [FlightsIntegrationService],
})
export class IntegrationsModule { }
