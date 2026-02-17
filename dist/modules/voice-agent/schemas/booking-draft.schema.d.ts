import { Document, Types } from 'mongoose';
import { BookingDraftStep, BookingDraftStatus } from '../../../common/constants/roles.constant';
export type BookingDraftDocument = BookingDraft & Document;
export declare class DraftSearchCriteria {
    origin?: string;
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    adults: number;
    children: number;
    infants: number;
    travelClass: string;
    isRoundTrip: boolean;
    maxPrice?: number;
    preferredAirline?: string;
}
export declare class DraftSelectedFlight {
    flightData: Record<string, any>;
    flightId?: string;
    price: number;
    currency: string;
    travelClass: string;
}
export declare class DraftSelectedStay {
    stayData: Record<string, any>;
    stayId?: string;
    roomId?: string;
    checkIn: string;
    checkOut: string;
    price: number;
    currency: string;
}
export declare class DraftSelectedCar {
    carData: Record<string, any>;
    carId?: string;
    pickUpDate: string;
    dropOffDate: string;
    price: number;
    currency: string;
}
export declare class DraftPassenger {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    passportNumber?: string;
    nationality?: string;
    type: string;
}
export declare class DraftContact {
    email: string;
    phone: string;
    name: string;
}
export declare class BookingDraft {
    user: Types.ObjectId;
    status: BookingDraftStatus;
    currentStep: BookingDraftStep;
    searchCriteria: DraftSearchCriteria;
    selectedFlights: DraftSelectedFlight[];
    selectedStays: DraftSelectedStay[];
    selectedCars: DraftSelectedCar[];
    selectedCruises: Record<string, any>[];
    passengerDetails: DraftPassenger[];
    contactDetails?: DraftContact;
    pricing?: Record<string, any>;
    searchResults: Record<string, any>[];
    lastInteractionAt: Date;
    voiceSessionId?: Types.ObjectId;
    bookingId?: string;
    pnr?: string;
    expiresAt: Date;
    metadata: Record<string, any>;
    completedSteps: string[];
}
export declare const BookingDraftSchema: import("mongoose").Schema<BookingDraft, import("mongoose").Model<BookingDraft, any, any, any, Document<unknown, any, BookingDraft, any, {}> & BookingDraft & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, BookingDraft, Document<unknown, {}, import("mongoose").FlatRecord<BookingDraft>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<BookingDraft> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
