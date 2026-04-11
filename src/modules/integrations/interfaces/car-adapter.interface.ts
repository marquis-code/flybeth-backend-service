// src/modules/integrations/interfaces/car-adapter.interface.ts

export interface CarSearchQuery {
  pickUpLocation: string; // IATA code or Geo location
  returnLocation?: string;
  pickUpDate: string; // YYYY-MM-DD
  pickUpTime: string; // HH:mm
  returnDate: string; // YYYY-MM-DD
  returnTime: string; // HH:mm
  vendorCode?: string;
  vehicleType?: string;
  currencyCode?: string;
  passengers?: number;
}

export interface CarSearchResult {
  provider: string;
  vendor: {
    code: string;
    name: string;
    logo?: string;
  };
  vehicle: {
    type: string;
    name: string; // Make and model if available
    passengers: number;
    bagsLarge: number;
    bagsSmall: number;
    doors?: number;
    transmission?: string;
    airConditioning?: boolean;
    fuelType?: string;
    images: string[];
  };
  bookingInfo: {
    rateKey: string;
    rateCode: string;
    availabilityStatus: string;
  };
  location: {
    pickUp: CarLocationInfo;
    return: CarLocationInfo;
  };
  price: {
    amount: number;
    currency: string;
    baseAmount?: number;
    totalAmount: number;
    approximateTotal: number;
  };
  extras?: Array<{
    code: string;
    amount: number;
    description?: string;
    status?: string;
  }>;
}

export interface CarLocationInfo {
  locationCode: string;
  extendedLocationCode?: string;
  name?: string;
  address?: {
    line1: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  latitude?: string;
  longitude?: string;
}

export interface CarPriceCheckResult {
  bookingKey?: string;
  priceChanged: boolean;
  priceDifference: number;
  currency: string;
  updatedResult: CarSearchResult;
}

export interface CarAdapter {
  providerName: string;
  searchCars(query: CarSearchQuery): Promise<CarSearchResult[]>;
  priceCheck(rateKey: string, details?: any): Promise<CarPriceCheckResult>;
}
