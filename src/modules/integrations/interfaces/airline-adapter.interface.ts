// src/modules/integrations/interfaces/airline-adapter.interface.ts

// ─── Search query / result (used by all adapters) ───
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

// ─── Amadeus-specific shapes ───

export interface AmadeusFlightSearchParams {
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children?: number;
    infants?: number;
    travelClass?: string;
    includedAirlineCodes?: string;
    excludedAirlineCodes?: string;
    nonStop?: boolean;
    currencyCode?: string;
    maxPrice?: number;
    max?: number;
}

export interface AmadeusFlightOfferPriceRequest {
    data: {
        type: 'flight-offers-pricing';
        flightOffers: any[];
    };
}

export interface AmadeusFlightOrderRequest {
    data: {
        type: 'flight-order';
        flightOffers: any[];
        travelers: AmadeusTraveler[];
        remarks?: {
            general?: Array<{ subType: string; text: string }>;
        };
        ticketingAgreement?: {
            option: string;
            delay?: string;
        };
        contacts?: any[];
    };
}

export interface AmadeusTraveler {
    id: string;
    dateOfBirth: string;
    name: {
        firstName: string;
        lastName: string;
    };
    gender: 'MALE' | 'FEMALE';
    contact?: {
        emailAddress: string;
        phones?: Array<{
            deviceType: string;
            countryCallingCode: string;
            number: string;
        }>;
    };
    documents?: Array<{
        documentType: string;
        birthPlace?: string;
        issuanceLocation?: string;
        issuanceDate?: string;
        number: string;
        expiryDate: string;
        issuanceCountry: string;
        validityCountry: string;
        nationality: string;
        holder: boolean;
    }>;
}

// ─── Adapter interface ───

export interface AirlineAdapter {
    providerName: string;
    searchFlights(query: FlightSearchQuery): Promise<FlightSearchResult[]>;
    bookFlight(flightId: string, passengers: any[]): Promise<{ pnr: string; ticketNumbers: string[] }>;
    cancelBooking(pnr: string): Promise<boolean>;

    // Amadeus-specific lifecycle (optional for other adapters)
    searchFlightOffers?(params: AmadeusFlightSearchParams): Promise<any>;
    priceFlightOffer?(request: AmadeusFlightOfferPriceRequest): Promise<any>;
    createFlightOrder?(request: AmadeusFlightOrderRequest): Promise<any>;
}
