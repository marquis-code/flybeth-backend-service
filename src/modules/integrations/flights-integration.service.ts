// src/modules/integrations/flights-integration.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AirlineAdapter, FlightSearchQuery, FlightSearchResult } from './interfaces/airline-adapter.interface';
import { AmadeusProvider } from './providers/amadeus.provider';

@Injectable()
export class FlightsIntegrationService {
    private adapters: AirlineAdapter[] = [];
    private readonly logger = new Logger(FlightsIntegrationService.name);

    constructor(private amadeusProvider: AmadeusProvider) {
        this.registerAdapter(amadeusProvider);
    }

    registerAdapter(adapter: AirlineAdapter) {
        this.adapters.push(adapter);
        this.logger.log(`Registered airline adapter: ${adapter.providerName}`);
    }

    async searchAllProviders(query: FlightSearchQuery): Promise<FlightSearchResult[]> {
        const promises = this.adapters.map(adapter =>
            adapter.searchFlights(query).catch(err => {
                this.logger.error(`Adapter ${adapter.providerName} failed: ${err.message}`);
                return [];
            })
        );

        const results = await Promise.all(promises);
        return results.flat().sort((a, b) => a.price - b.price); // Cheapest first
    }
}
