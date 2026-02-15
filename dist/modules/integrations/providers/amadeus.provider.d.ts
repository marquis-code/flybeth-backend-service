import { AirlineAdapter, FlightSearchQuery, FlightSearchResult } from '../interfaces/airline-adapter.interface';
export declare class AmadeusProvider implements AirlineAdapter {
    readonly providerName = "Amadeus";
    private readonly logger;
    searchFlights(query: FlightSearchQuery): Promise<FlightSearchResult[]>;
    bookFlight(flightId: string, passengers: any[]): Promise<{
        pnr: string;
        ticketNumbers: string[];
    }>;
    cancelBooking(pnr: string): Promise<boolean>;
}
