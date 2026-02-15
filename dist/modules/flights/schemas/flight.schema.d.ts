import { Document, Types } from 'mongoose';
import { FlightStatus, FlightClass } from '../../../common/constants/roles.constant';
export type FlightDocument = Flight & Document;
export declare class AirportDetail {
    airport: string;
    city: string;
    country: string;
    terminal: string;
    gate: string;
    time: Date;
}
export declare class FlightClassDetail {
    type: FlightClass;
    basePrice: number;
    currency: string;
    seatsAvailable: number;
    seatsTotal: number;
    baggage: string;
    amenities: string[];
}
export declare class StopDetail {
    airport: string;
    city: string;
    arrivalTime: Date;
    departureTime: Date;
    duration: number;
}
export declare class Flight {
    airline: string;
    flightNumber: string;
    aircraft: string;
    departure: AirportDetail;
    arrival: AirportDetail;
    duration: number;
    stops: number;
    stopDetails: StopDetail[];
    classes: FlightClassDetail[];
    status: FlightStatus;
    tenant: Types.ObjectId;
    isFeatured: boolean;
    isActive: boolean;
    operatingDays: string[];
    validFrom: Date;
    validUntil: Date;
}
export declare const FlightSchema: import("mongoose").Schema<Flight, import("mongoose").Model<Flight, any, any, any, Document<unknown, any, Flight, any, {}> & Flight & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Flight, Document<unknown, {}, import("mongoose").FlatRecord<Flight>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Flight> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
