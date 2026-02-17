// src/modules/voice-agent/schemas/booking-draft.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
    BookingDraftStep,
    BookingDraftStatus,
} from '../../../common/constants/roles.constant';

export type BookingDraftDocument = BookingDraft & Document;

@Schema({ _id: false })
export class DraftSearchCriteria {
    @Prop()
    origin?: string;

    @Prop()
    destination?: string;

    @Prop()
    departureDate?: string;

    @Prop()
    returnDate?: string;

    @Prop({ default: 1 })
    adults: number;

    @Prop({ default: 0 })
    children: number;

    @Prop({ default: 0 })
    infants: number;

    @Prop({ default: 'economy' })
    travelClass: string;

    @Prop({ default: false })
    isRoundTrip: boolean;

    @Prop()
    maxPrice?: number;

    @Prop()
    preferredAirline?: string;
}

@Schema({ _id: false })
export class DraftSelectedFlight {
    @Prop({ type: Object, required: true })
    flightData: Record<string, any>;

    @Prop()
    flightId?: string;

    @Prop()
    price: number;

    @Prop()
    currency: string;

    @Prop()
    travelClass: string;
}

@Schema({ _id: false })
export class DraftSelectedStay {
    @Prop({ type: Object, required: true })
    stayData: Record<string, any>;

    @Prop()
    stayId?: string;

    @Prop()
    roomId?: string;

    @Prop()
    checkIn: string;

    @Prop()
    checkOut: string;

    @Prop()
    price: number;

    @Prop()
    currency: string;
}

@Schema({ _id: false })
export class DraftSelectedCar {
    @Prop({ type: Object, required: true })
    carData: Record<string, any>;

    @Prop()
    carId?: string;

    @Prop()
    pickUpDate: string;

    @Prop()
    dropOffDate: string;

    @Prop()
    price: number;

    @Prop()
    currency: string;
}

@Schema({ _id: false })
export class DraftPassenger {
    @Prop()
    firstName: string;

    @Prop()
    lastName: string;

    @Prop()
    dateOfBirth?: string;

    @Prop()
    passportNumber?: string;

    @Prop()
    nationality?: string;

    @Prop({ default: 'adult' })
    type: string;
}

@Schema({ _id: false })
export class DraftContact {
    @Prop()
    email: string;

    @Prop()
    phone: string;

    @Prop()
    name: string;
}

@Schema({ timestamps: true, collection: 'booking_drafts' })
export class BookingDraft {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    user: Types.ObjectId;

    @Prop({ enum: BookingDraftStatus, default: BookingDraftStatus.IN_PROGRESS })
    status: BookingDraftStatus;

    @Prop({ enum: BookingDraftStep, default: BookingDraftStep.SEARCH })
    currentStep: BookingDraftStep;

    @Prop({ type: DraftSearchCriteria, default: () => ({}) })
    searchCriteria: DraftSearchCriteria;

    @Prop({ type: [DraftSelectedFlight], default: [] })
    selectedFlights: DraftSelectedFlight[];

    @Prop({ type: [DraftSelectedStay], default: [] })
    selectedStays: DraftSelectedStay[];

    @Prop({ type: [DraftSelectedCar], default: [] })
    selectedCars: DraftSelectedCar[];

    @Prop({ type: [Object], default: [] })
    selectedCruises: Record<string, any>[];

    @Prop({ type: [DraftPassenger], default: [] })
    passengerDetails: DraftPassenger[];

    @Prop({ type: DraftContact })
    contactDetails?: DraftContact;

    @Prop({ type: Object })
    pricing?: Record<string, any>;

    @Prop({ type: [Object], default: [] })
    searchResults: Record<string, any>[];

    @Prop()
    lastInteractionAt: Date;

    @Prop({ type: Types.ObjectId, ref: 'VoiceSession' })
    voiceSessionId?: Types.ObjectId;

    @Prop()
    bookingId?: string;

    @Prop()
    pnr?: string;

    @Prop()
    expiresAt: Date;

    @Prop({ type: Object, default: {} })
    metadata: Record<string, any>;

    @Prop({ type: [String], default: [] })
    completedSteps: string[];
}

export const BookingDraftSchema = SchemaFactory.createForClass(BookingDraft);

// TTL: auto-expire abandoned drafts after 24 hours
BookingDraftSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 },
);
BookingDraftSchema.index({ user: 1, status: 1 });
BookingDraftSchema.index({ lastInteractionAt: 1 });
BookingDraftSchema.index({ createdAt: -1 });
