import { Document, Types } from 'mongoose';
export type CarDocument = Car & Document;
export declare class Car {
    name: string;
    type: string;
    vendor: string;
    category: string;
    capacity: {
        passengers: number;
        luggage: number;
    };
    specifications: {
        transmission?: 'automatic' | 'manual';
        fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid';
        airConditioning?: boolean;
        doors?: number;
    };
    pricing: {
        baseRate: number;
        currency: string;
    };
    images: string[];
    isAvailable: boolean;
    availableLocations: string[];
}
export declare const CarSchema: import("mongoose").Schema<Car, import("mongoose").Model<Car, any, any, any, Document<unknown, any, Car, any, {}> & Car & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Car, Document<unknown, {}, import("mongoose").FlatRecord<Car>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Car> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
