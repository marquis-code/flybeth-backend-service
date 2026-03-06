// src/modules/integrations/interfaces/transfers-adapter.interface.ts

export interface TransferSearchQuery {
  startLocationCode: string; // IATA (e.g. CDG)
  endAddressLine?: string;
  endCityName?: string;
  endZipCode?: string;
  endCountryCode?: string;
  endGeoCode?: string; // "lat,long"
  startDateTime: string; // ISO DateTime
  passengers: number;
  transferType?: "PRIVATE" | "SHARED" | "ALL";
}

export interface TransferSearchResult {
  provider: string;
  offerId: string;
  transferType: string;
  vehicleCode: string;
  vehicleDescription: string;
  price: number;
  currency: string;
  convertedPrice?: number;
  convertedCurrency?: string;
  distance?: {
    value: number;
    unit: string;
  };
  duration?: string;
  cancellationPolicy?: string;
}

export interface TransferBookingResult {
  bookingId: string;
  status: string;
  confirmationNumber?: string;
}

export interface TransfersAdapter {
  providerName: string;
  searchTransfers(query: TransferSearchQuery): Promise<TransferSearchResult[]>;
  createTransferOrder(
    offerId: string,
    passengerDetails: any,
  ): Promise<TransferOrderingResult>;
}

export interface TransferOrderingResult {
  orderId: string;
  status: string;
  confirmationNumber?: string;
}
