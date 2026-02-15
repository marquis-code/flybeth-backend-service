// src/modules/bookings/schemas/booking.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BookingStatus, PaymentStatus } from '../../../common/constants/roles.constant';

export type BookingDocument = Booking & Document;

@Schema({ _id: false })
export class BookingFlight {
    @Prop({ type: Types.ObjectId, ref: 'Flight', required: true })
    flight: Types.ObjectId;

    @Prop({ required: true })
    class: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Passenger' }], default: [] })
    passengers: Types.ObjectId[];
}

@Schema({ _id: false })
export class BookingStay {
    @Prop({ type: Types.ObjectId, ref: 'Stay', required: true })
    stay: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Room', required: true })
    room: Types.ObjectId;

    @Prop({ required: true })
    checkIn: Date;

    @Prop({ required: true })
    checkOut: Date;

    @Prop({ type: Object, required: true })
    occupancy: {
        rooms: number;
        adults: number;
        children: number;
        childAges?: number[];
    };
}

@Schema({ _id: false })
export class BookingCar {
    @Prop({ type: Types.ObjectId, required: true })
    car: Types.ObjectId;

    @Prop({ required: true })
    pickUpDate: Date;

    @Prop({ required: true })
    dropOffDate: Date;

    @Prop()
    pickUpLocation: string;

    @Prop()
    dropOffLocation: string;
}

@Schema({ _id: false })
export class BookingCruise {
    @Prop({ type: Types.ObjectId, ref: 'Cruise', required: true })
    cruise: Types.ObjectId;

    @Prop({ required: true })
    cabinType: string;

    @Prop({ required: true })
    departureDate: Date;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Passenger' }], default: [] })
    passengers: Types.ObjectId[];
}

@Schema({ _id: false })
export class BookingContact {
    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    phone: string;

    @Prop()
    name: string;
}

@Schema({ _id: false })
export class BookingPricing {
    @Prop({ required: true })
    baseFare: number;

    @Prop({ default: 0 })
    taxes: number;

    @Prop({ default: 0 })
    fees: number;

    @Prop({ default: 0 })
    tenantMarkup: number;

    @Prop({ default: 0 })
    discount: number;

    @Prop({ required: true })
    totalAmount: number;

    @Prop({ required: true, default: 'USD' })
    currency: string;

    @Prop()
    originalCurrency: string;

    @Prop()
    originalAmount: number;

    @Prop()
    exchangeRate: number;
}

@Schema({ _id: false })
export class BookingPayment {
    @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
    status: PaymentStatus;

    @Prop()
    method: string;

    @Prop()
    transactionId: string;

    @Prop()
    provider: string;

    @Prop()
    paidAt: Date;
}

@Schema({ _id: false })
export class BookingCancellation {
    @Prop()
    reason: string;

    @Prop()
    cancelledAt: Date;

    @Prop({ default: 0 })
    refundAmount: number;

    @Prop({ enum: ['pending', 'processed', 'failed'], default: 'pending' })
    refundStatus: string;
}

@Schema({ timestamps: true, collection: 'bookings' })
export class Booking {
    @Prop({ required: true, unique: true })
    pnr: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Tenant', default: null })
    tenant: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Package', default: null })
    package: Types.ObjectId;

    @Prop({ type: [BookingFlight], default: [] })
    flights: BookingFlight[];

    @Prop({ type: [BookingStay], default: [] })
    stays: BookingStay[];

    @Prop({ type: [BookingCar], default: [] })
    cars: BookingCar[];

    @Prop({ type: [BookingCruise], default: [] })
    cruises: BookingCruise[];

    @Prop({ type: BookingContact, required: true })
    contactDetails: BookingContact;

    @Prop({ type: BookingPricing, required: true })
    pricing: BookingPricing;

    @Prop({ type: BookingPayment, default: () => ({}) })
    payment: BookingPayment;

    @Prop({ enum: BookingStatus, default: BookingStatus.PENDING })
    status: BookingStatus;

    @Prop({ type: BookingCancellation })
    cancellation: BookingCancellation;

    @Prop()
    expiresAt: Date;

    @Prop({ default: Date.now })
    bookedAt: Date;

    @Prop()
    notes: string;

    @Prop({ type: Number, default: 1 })
    totalPassengers: number;

    @Prop({ default: false })
    isRoundTrip: boolean;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Comprehensive indexes for booking queries
BookingSchema.index({ pnr: 1 }, { unique: true });
BookingSchema.index({ user: 1, status: 1 });
BookingSchema.index({ tenant: 1, status: 1 });
BookingSchema.index({ status: 1, expiresAt: 1 });
BookingSchema.index({ bookedAt: -1 });
BookingSchema.index({ 'payment.status': 1 });
BookingSchema.index({ tenant: 1, bookedAt: -1 });
BookingSchema.index({ user: 1, bookedAt: -1 });
BookingSchema.index({ pnr: 'text' });
