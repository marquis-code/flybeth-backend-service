// src/modules/integrations/interfaces/airline-adapter.interface.ts

export interface FlightSearchQuery {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  class?: string; // economy, business, premium_economy, first
  maxConnections?: number;
  userRole?: string;
  customerId?: string;
}

export interface FlightSegment {
  flightNumber: string;
  airline: string;
  airlineLogo?: string;
  origin: string;
  destination: string;
  originTerminal?: string;
  destinationTerminal?: string;
  departureTime: string;
  arrivalTime: string;
  duration: number; // minutes
  aircraft?: string;
  operatingCarrier?: string;
  marketingCarrier?: string;
}

export interface FlightSearchResult {
  provider: string;
  offerId: string; // Provider's internal ID for booking
  airline: string;
  airlineLogo?: string;
  flightNumbers: string[];
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number; // minutes
  price: number;
  priceWithCommission: number;
  currency: string;
  seatsAvailable?: number;
  stops: number;
  segments: FlightSegment[];
  cabinClass?: string;
  expiresAt?: string;
  conditions?: {
    refundable: boolean;
    changeable: boolean;
    refundPenalty?: string;
    changePenalty?: string;
  };
  baggageIncluded?: string;
  totalEmissionsKg?: number;
  rawOffer?: any;
}

export interface AirlineAdapter {
  providerName: string;
  searchFlights(query: FlightSearchQuery): Promise<FlightSearchResult[]>;
  priceOffer?(offer: any): Promise<any>;
  getSeatmap?(flightOffer: any): Promise<any>;
  getOfferDetails?(offerId: string): Promise<FlightSearchResult | null>;
  bookFlight(
    offerId: string,
    passengers: any[],
    payment?: any,
    offer?: any,
  ): Promise<{ pnr: string; orderId: string; ticketNumbers?: string[] }>;
  cancelBooking(
    orderId: string,
  ): Promise<{ success: boolean; refundAmount?: number }>;
  searchLocations?(keyword: string, countryCode?: string): Promise<any[]>;
  getNearestAirports?(latitude: number, longitude: number): Promise<any[]>;
  predictTripPurpose?(
    origin: string,
    destination: string,
    departureDate: string,
    returnDate: string,
  ): Promise<any>;
  getFlightInspiration?(origin: string, departureDate?: string): Promise<any[]>;
  createCustomer?(userData: any): Promise<any>;
  createClientKey?(customerId: string): Promise<any>;
  createHoldOrder?(
    offerId: string,
    passengers: any[],
  ): Promise<{ pnr: string; orderId: string; expiresAt: string }>;
  payForOrder?(
    orderId: string,
    payment: any,
  ): Promise<{ success: boolean; ticketNumbers?: string[] }>;
  createCard?(cardData: any): Promise<any>;
  deleteCard?(cardId: string): Promise<any>;
  create3DSSession?(sessionData: any): Promise<any>;
}
