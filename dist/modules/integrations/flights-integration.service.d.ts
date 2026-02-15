import { AirlineAdapter, FlightSearchQuery, FlightSearchResult } from './interfaces/airline-adapter.interface';
import { AmadeusProvider } from './providers/amadeus.provider';
export declare class FlightsIntegrationService {
    private amadeusProvider;
    private adapters;
    private readonly logger;
    constructor(amadeusProvider: AmadeusProvider);
    registerAdapter(adapter: AirlineAdapter): void;
    searchAllProviders(query: FlightSearchQuery): Promise<FlightSearchResult[]>;
}
