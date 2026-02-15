// src/modules/integrations/interfaces/airline-adapter.interface.ts
export interface FlightSearchQuery {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers: number;
    class?: string;
}

export interface FlightSearchResult {
    provider: string;
    flightNumber: string;
    airline: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    duration: number; // minutes
    price: number;
    currency: string;
    seatsAvailable: number;
}

export interface AirlineAdapter {
    providerName: string;
    searchFlights(query: FlightSearchQuery): Promise<FlightSearchResult[]>;
    bookFlight(flightId: string, passengers: any[]): Promise<{ pnr: string; ticketNumbers: string[] }>;
    cancelBooking(pnr: string): Promise<boolean>;
}
