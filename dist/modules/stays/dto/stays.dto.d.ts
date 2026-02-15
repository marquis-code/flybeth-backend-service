export declare class OccupancyDto {
    rooms: number;
    adults: number;
    children?: number;
    childAges?: number[];
}
export declare class StaySearchDto {
    city?: string;
    country?: string;
    checkIn?: string;
    checkOut?: string;
    occupancy?: OccupancyDto;
}
