// src/modules/stays/schemas/stay.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StayDocument = Stay & Document;

@Schema({ timestamps: true })
export class Stay {
    @Prop({ required: true, index: 'text' })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true, enum: ['hotel', 'apartment', 'villa', 'resort', 'cabin'] })
    type: string;

    @Prop({ type: Object, required: true })
    location: {
        address: string;
        city: string;
        country: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };

    @Prop([String])
    images: string[];

    @Prop([String])
    amenities: string[]; // e.g., 'wifi', 'pool', 'gym'

    @Prop({ min: 1, max: 5 })
    rating: number;

    @Prop({ type: Types.ObjectId, ref: 'Tenant' })
    tenant: Types.ObjectId;

    @Prop({ default: true })
    isActive: boolean;
}

export const StaySchema = SchemaFactory.createForClass(Stay);
StaySchema.index({ 'location.city': 1, 'location.country': 1 });
StaySchema.index({ type: 1 });
