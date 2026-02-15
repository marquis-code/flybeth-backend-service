import { Document, Types } from 'mongoose';
export type CruiseDocument = Cruise & Document;
export declare class CruiseCabinClass {
    type: string;
    price: number;
    availability: number;
}
export declare class Cruise {
    name: string;
    destination: string;
    cruiseLine: string;
    departurePort: string;
    departureDate: Date;
    durationNights: number;
    cabinClasses: CruiseCabinClass[];
    images: string[];
    isAvailable: boolean;
    description: string;
}
export declare const CruiseSchema: import("mongoose").Schema<Cruise, import("mongoose").Model<Cruise, any, any, any, Document<unknown, any, Cruise, any, {}> & Cruise & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Cruise, Document<unknown, {}, import("mongoose").FlatRecord<Cruise>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Cruise> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
