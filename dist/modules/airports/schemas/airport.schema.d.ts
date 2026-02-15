import { Document } from 'mongoose';
export type AirportDocument = Airport & Document;
export declare class Airport {
    code: string;
    name: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
    timezone: string;
}
export declare const AirportSchema: import("mongoose").Schema<Airport, import("mongoose").Model<Airport, any, any, any, Document<unknown, any, Airport, any, {}> & Airport & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Airport, Document<unknown, {}, import("mongoose").FlatRecord<Airport>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Airport> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export type AirlineDocument = Airline & Document;
export declare class Airline {
    code: string;
    name: string;
    logo: string;
    country: string;
    isActive: boolean;
}
export declare const AirlineSchema: import("mongoose").Schema<Airline, import("mongoose").Model<Airline, any, any, any, Document<unknown, any, Airline, any, {}> & Airline & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Airline, Document<unknown, {}, import("mongoose").FlatRecord<Airline>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Airline> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
