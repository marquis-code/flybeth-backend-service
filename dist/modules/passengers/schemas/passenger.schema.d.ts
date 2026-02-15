import { Document, Types } from 'mongoose';
export type PassengerDocument = Passenger & Document;
export declare class Passenger {
    user: Types.ObjectId;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string;
    nationality: string;
    passportNumber: string;
    passportExpiry: Date;
    passportCountry: string;
    email: string;
    phone: string;
    type: string;
    frequentFlyer: {
        airline: string;
        number: string;
    };
}
export declare const PassengerSchema: import("mongoose").Schema<Passenger, import("mongoose").Model<Passenger, any, any, any, Document<unknown, any, Passenger, any, {}> & Passenger & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Passenger, Document<unknown, {}, import("mongoose").FlatRecord<Passenger>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Passenger> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
