// src/modules/cars/schemas/car.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CarDocument = Car & Document;

@Schema({ timestamps: true, collection: 'cars' })
export class Car {
    @Prop({ required: true })
    name: string; // e.g., "Toyota Corolla" or "Tesla Model 3"

    @Prop({ required: true, enum: ['rental', 'ride'] })
    type: string;

    @Prop({ required: true })
    vendor: string; // e.g., "Hertz", "Uber", "Lyft"

    @Prop({ required: true })
    category: string; // e.g., "Economy", "SUV", "Luxury", "Standard"

    @Prop({ required: true })
    capacity: {
        passengers: number;
        luggage: number;
    };

    @Prop({ type: Object })
    specifications: {
        transmission?: 'automatic' | 'manual';
        fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid';
        airConditioning?: boolean;
        doors?: number;
    };

    @Prop({ required: true })
    pricing: {
        baseRate: number; // Daily for rental, per trip/per km for ride
        currency: string;
    };

    @Prop({ type: [String], default: [] })
    images: string[];

    @Prop({ default: true })
    isAvailable: boolean;

    @Prop({ type: [String], default: [] })
    availableLocations: string[]; // Cities or Airport codes
}

export const CarSchema = SchemaFactory.createForClass(Car);

CarSchema.index({ type: 1, availableLocations: 1 });
CarSchema.index({ vendor: 1 });
CarSchema.index({ category: 1 });
CarSchema.index({ name: 'text', vendor: 'text' });
