import { Document, Types } from 'mongoose';
import { BookingStatus, PaymentStatus } from '../../../common/constants/roles.constant';
export type BookingDocument = Booking & Document;
export declare class BookingFlight {
    flight: Types.ObjectId;
    class: string;
    passengers: Types.ObjectId[];
}
export declare class BookingStay {
    stay: Types.ObjectId;
    room: Types.ObjectId;
    checkIn: Date;
    checkOut: Date;
    occupancy: {
        rooms: number;
        adults: number;
        children: number;
        childAges?: number[];
    };
}
export declare class BookingCar {
    car: Types.ObjectId;
    pickUpDate: Date;
    dropOffDate: Date;
    pickUpLocation: string;
    dropOffLocation: string;
}
export declare class BookingCruise {
    cruise: Types.ObjectId;
    cabinType: string;
    departureDate: Date;
    passengers: Types.ObjectId[];
}
export declare class BookingContact {
    email: string;
    phone: string;
    name: string;
}
export declare class BookingPricing {
    baseFare: number;
    taxes: number;
    fees: number;
    tenantMarkup: number;
    discount: number;
    totalAmount: number;
    currency: string;
    originalCurrency: string;
    originalAmount: number;
    exchangeRate: number;
}
export declare class BookingPayment {
    status: PaymentStatus;
    method: string;
    transactionId: string;
    provider: string;
    paidAt: Date;
}
export declare class BookingCancellation {
    reason: string;
    cancelledAt: Date;
    refundAmount: number;
    refundStatus: string;
}
export declare class Booking {
    pnr: string;
    user: Types.ObjectId;
    tenant: Types.ObjectId;
    package: Types.ObjectId;
    flights: BookingFlight[];
    stays: BookingStay[];
    cars: BookingCar[];
    cruises: BookingCruise[];
    contactDetails: BookingContact;
    pricing: BookingPricing;
    payment: BookingPayment;
    status: BookingStatus;
    cancellation: BookingCancellation;
    expiresAt: Date;
    bookedAt: Date;
    notes: string;
    totalPassengers: number;
    isRoundTrip: boolean;
}
export declare const BookingSchema: import("mongoose").Schema<Booking, import("mongoose").Model<Booking, any, any, any, Document<unknown, any, Booking, any, {}> & Booking & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Booking, Document<unknown, {}, import("mongoose").FlatRecord<Booking>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Booking> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
