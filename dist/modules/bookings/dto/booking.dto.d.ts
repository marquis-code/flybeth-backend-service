import { OccupancyDto } from '../../stays/dto/stays.dto';
declare class BookingStayDto {
    hotelId: string;
    roomId: string;
    checkIn: string;
    checkOut: string;
    occupancy: OccupancyDto;
}
declare class BookingCarDto {
    carId: string;
    pickUpDate: string;
    dropOffDate: string;
    pickUpLocation?: string;
    dropOffLocation?: string;
}
declare class BookingFlightDto {
    flightId: string;
    class: string;
    passengerIds: string[];
}
declare class BookingCruiseDto {
    cruiseId: string;
    cabinType: string;
    departureDate: string;
    passengerIds: string[];
}
declare class BookingContactDto {
    email: string;
    phone: string;
    name?: string;
}
export declare class CreateBookingDto {
    flights?: BookingFlightDto[];
    stays?: BookingStayDto[];
    cars?: BookingCarDto[];
    cruises?: BookingCruiseDto[];
    contactDetails: BookingContactDto;
    tenantId?: string;
    packageId?: string;
    currency?: string;
    notes?: string;
    isRoundTrip?: boolean;
}
export declare class CancelBookingDto {
    reason: string;
}
export declare class BookingQueryDto {
    status?: string;
    tenantId?: string;
    startDate?: string;
    endDate?: string;
}
export {};
