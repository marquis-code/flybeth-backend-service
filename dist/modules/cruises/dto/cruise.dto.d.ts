export declare class SearchCruisesDto {
    destination?: string;
    departureMonth?: string;
    minNights?: number;
    maxNights?: number;
    cruiseLine?: string;
}
export declare class CreateCruiseDto {
    name: string;
    destination: string;
    cruiseLine: string;
    departurePort: string;
    departureDate: string;
    durationNights: number;
    cabinClasses: {
        type: string;
        price: number;
        availability: number;
    }[];
    images?: string[];
    description?: string;
}
