// src/modules/flights/schemas/flight.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FlightStatus, FlightClass } from '../../../common/constants/roles.constant';

export type FlightDocument = Flight & Document;

@Schema({ _id: false })
export class AirportDetail {
    @Prop({ required: true })
    airport: string; // IATA code

    @Prop({ required: true })
    city: string;

    @Prop({ required: true })
    country: string;

    @Prop()
    terminal: string;

    @Prop()
    gate: string;

    @Prop({ required: true })
    time: Date;
}

@Schema({ _id: false })
export class FlightClassDetail {
    @Prop({ enum: FlightClass, required: true })
    type: FlightClass;

    @Prop({ required: true })
    basePrice: number;

    @Prop({ required: true, default: 'USD' })
    currency: string;

    @Prop({ required: true, default: 0 })
    seatsAvailable: number;

    @Prop({ default: 0 })
    seatsTotal: number;

    @Prop()
    baggage: string;

    @Prop({ type: [String], default: [] })
    amenities: string[];
}

@Schema({ _id: false })
export class StopDetail {
    @Prop()
    airport: string;

    @Prop()
    city: string;

    @Prop()
    arrivalTime: Date;

    @Prop()
    departureTime: Date;

    @Prop()
    duration: number; // minutes
}

@Schema({ timestamps: true, collection: 'flights' })
export class Flight {
    @Prop({ required: true })
    airline: string;

    @Prop({ required: true })
    flightNumber: string;

    @Prop()
    aircraft: string;

    @Prop({ type: AirportDetail, required: true })
    departure: AirportDetail;

    @Prop({ type: AirportDetail, required: true })
    arrival: AirportDetail;

    @Prop({ required: true })
    duration: number; // minutes

    @Prop({ default: 0 })
    stops: number;

    @Prop({ type: [StopDetail], default: [] })
    stopDetails: StopDetail[];

    @Prop({ type: [FlightClassDetail], required: true })
    classes: FlightClassDetail[];

    @Prop({ enum: FlightStatus, default: FlightStatus.SCHEDULED })
    status: FlightStatus;

    @Prop({ type: Types.ObjectId, ref: 'Tenant', default: null })
    tenant: Types.ObjectId;

    @Prop({ default: false })
    isFeatured: boolean;

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    operatingDays: string[]; // ['MON', 'TUE', ...]

    @Prop()
    validFrom: Date;

    @Prop()
    validUntil: Date;
}

export const FlightSchema = SchemaFactory.createForClass(Flight);

// Performance indexes
FlightSchema.index({ 'departure.airport': 1, 'arrival.airport': 1, 'departure.time': 1 });
FlightSchema.index({ airline: 1 });
FlightSchema.index({ flightNumber: 1 });
FlightSchema.index({ status: 1, isActive: 1 });
FlightSchema.index({ tenant: 1 });
FlightSchema.index({ 'classes.basePrice': 1 });
FlightSchema.index({ stops: 1 });
FlightSchema.index({ 'departure.time': 1 });
FlightSchema.index({ isFeatured: 1, isActive: 1 });
FlightSchema.index({
    airline: 'text',
    flightNumber: 'text',
    'departure.city': 'text',
    'arrival.city': 'text',
    'departure.airport': 'text',
    'arrival.airport': 'text',
});
