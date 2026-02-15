// src/modules/cruises/schemas/cruise.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CruiseDocument = Cruise & Document;

@Schema({ _id: false })
export class CruiseCabinClass {
    @Prop({ required: true })
    type: string; // Internal, Oceanview, Balcony, Suite

    @Prop({ required: true })
    price: number;

    @Prop({ required: true })
    availability: number;
}

@Schema({ timestamps: true, collection: 'cruises' })
export class Cruise {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    destination: string; // Caribbean, Bahamas, Alaska, etc.

    @Prop({ required: true })
    cruiseLine: string; // Carnival, Royal Caribbean, etc.

    @Prop({ required: true })
    departurePort: string;

    @Prop({ required: true })
    departureDate: Date;

    @Prop({ required: true })
    durationNights: number;

    @Prop({ type: [CruiseCabinClass], default: [] })
    cabinClasses: CruiseCabinClass[];

    @Prop({ type: [String], default: [] })
    images: string[];

    @Prop({ default: true })
    isAvailable: boolean;

    @Prop()
    description: string;
}

export const CruiseSchema = SchemaFactory.createForClass(Cruise);

CruiseSchema.index({ destination: 1, departureDate: 1 });
CruiseSchema.index({ cruiseLine: 1 });
CruiseSchema.index({ durationNights: 1 });
CruiseSchema.index({ name: 'text', destination: 'text' });
