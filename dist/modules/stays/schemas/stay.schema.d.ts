import { Document, Types } from 'mongoose';
export type StayDocument = Stay & Document;
export declare class Stay {
    name: string;
    description: string;
    type: string;
    location: {
        address: string;
        city: string;
        country: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    images: string[];
    amenities: string[];
    rating: number;
    tenant: Types.ObjectId;
    isActive: boolean;
}
export declare const StaySchema: import("mongoose").Schema<Stay, import("mongoose").Model<Stay, any, any, any, Document<unknown, any, Stay, any, {}> & Stay & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Stay, Document<unknown, {}, import("mongoose").FlatRecord<Stay>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Stay> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
