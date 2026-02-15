export declare class SearchCarsDto {
    type: string;
    pickUpLocation: string;
    dropOffLocation?: string;
    pickUpDate: string;
    dropOffDate: string;
    pickUpTime?: string;
    dropOffTime?: string;
    category?: string;
    passengers?: number;
}
export declare class CreateCarDto {
    name: string;
    type: string;
    vendor: string;
    category: string;
    capacity: {
        passengers: number;
        luggage: number;
    };
    specifications?: {
        transmission?: 'automatic' | 'manual';
        fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid';
        airConditioning?: boolean;
        doors?: number;
    };
    pricing: {
        baseRate: number;
        currency: string;
    };
    availableLocations: string[];
}
