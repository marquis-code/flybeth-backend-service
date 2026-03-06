// src/modules/integrations/interfaces/stays-adapter.interface.ts

export interface StaysSearchQuery {
  location?: {
    latitude: number;
    longitude: number;
    radius?: number; // km, default 5
  };
  accommodationId?: string; // Search by specific accommodation
  checkInDate: string; // ISO date
  checkOutDate: string; // ISO date
  guests: Array<{ type: "adult" | "child"; age?: number }>;
  rooms: number;
  freeCancellationOnly?: boolean;
}

export interface StaysSearchResult {
  provider: string;
  accommodationId: string; // Provider's ID
  name: string;
  description?: string;
  photos: string[];
  rating?: number;
  reviewScore?: number;
  reviewCount?: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    countryCode: string;
  };
  cheapestPrice: number;
  priceWithCommission: number;
  currency: string;
  amenities: Array<{ type: string; description: string }>;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  brand?: string;
  chain?: string;
  expiresAt?: string;
  searchResultId?: string; // For fetching rates
}

export interface StaysRoomResult {
  name: string;
  photos: string[];
  beds: Array<{ type: string; count: number }>;
  rates: StaysRateResult[];
}

export interface StaysRateResult {
  rateId: string;
  price: number;
  priceWithCommission: number;
  currency: string;
  boardType?: string;
  paymentType?: string;
  cancellationTimeline?: Array<{
    before: string;
    refundAmount: string;
    currency: string;
  }>;
  conditions?: Array<{ title: string; description: string }>;
  expiresAt?: string;
}

export interface StaysBookingResult {
  bookingId: string;
  reference?: string;
  status: string;
  accommodationName: string;
  checkInDate: string;
  checkOutDate: string;
  confirmedAt?: string;
}

export interface StaysAdapter {
  providerName: string;
  searchStays(query: StaysSearchQuery): Promise<StaysSearchResult[]>;
  getAccommodationDetails(
    accommodationId: string,
  ): Promise<Partial<StaysSearchResult>>;
  fetchRates?(
    searchResultId: string,
    query?: Partial<StaysSearchQuery>,
  ): Promise<StaysRoomResult[]>;
  createQuote?(rateId: string): Promise<any>;
  createBooking?(
    quoteId: string,
    guestDetails: any,
  ): Promise<StaysBookingResult>;
  cancelBooking?(bookingId: string): Promise<any>;
}
