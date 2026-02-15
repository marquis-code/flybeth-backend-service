// src/modules/packages/schemas/package.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PackageDocument = Package & Document;

@Schema({ timestamps: true })
export class Package {
    @Prop({ required: true, index: 'text' })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop([String])
    images: string[];

    // Flight component (could be a specific flight ID or a route)
    // For simplicity, we'll link to a specific flight for now
    @Prop({ type: Types.ObjectId, ref: 'Flight' })
    flight: Types.ObjectId;

    // Stay component
    @Prop({ type: Types.ObjectId, ref: 'Stay' })
    stay: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Car' })
    car: Types.ObjectId;

    @Prop({ required: true, enum: ['hotel+flight', 'hotel+flight+car', 'flight+car', 'hotel+car'] })
    packageType: string;

    // Total price calculations
    @Prop({ required: true })
    basePrice: number;

    @Prop({ required: true, min: 0, max: 100 })
    discountPercentage: number; // e.g., 15% off

    @Prop({ required: true })
    totalPrice: number; // basePrice * (1 - discount/100)

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ type: Date })
    validFrom: Date;

    @Prop({ type: Date })
    validUntil: Date;
}

export const PackageSchema = SchemaFactory.createForClass(Package);
PackageSchema.index({ totalPrice: 1 });
