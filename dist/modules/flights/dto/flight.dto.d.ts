import { FlightClass, FlightStatus } from '../../../common/constants/roles.constant';
declare class AirportDetailDto {
    airport: string;
    city: string;
    country: string;
    terminal?: string;
    gate?: string;
    time: string;
}
declare class FlightClassDto {
    type: FlightClass;
    basePrice: number;
    currency: string;
    seatsAvailable: number;
    seatsTotal?: number;
    baggage?: string;
    amenities?: string[];
}
export declare class CreateFlightDto {
    airline: string;
    flightNumber: string;
    aircraft?: string;
    departure: AirportDetailDto;
    arrival: AirportDetailDto;
    duration: number;
    stops?: number;
    classes: FlightClassDto[];
    tenantId?: string;
    isFeatured?: boolean;
    operatingDays?: string[];
}
export declare class SearchFlightsDto {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults?: number;
    children?: number;
    infantsOnLap?: number;
    infantsInSeat?: number;
    class?: FlightClass;
    minPrice?: number;
    maxPrice?: number;
    airline?: string;
    maxStops?: number;
    sortBy?: string;
    sortOrder?: string;
    currency?: string;
    page?: number;
    limit?: number;
}
export declare class UpdateFlightDto {
    aircraft?: string;
    status?: FlightStatus;
    classes?: FlightClassDto[];
    isFeatured?: boolean;
    isActive?: boolean;
}
export {};
