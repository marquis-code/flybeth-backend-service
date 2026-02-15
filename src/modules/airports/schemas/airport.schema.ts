// src/modules/airports/schemas/airport.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AirportDocument = Airport & Document;

@Schema({ timestamps: true, collection: 'airports' })
export class Airport {
    @Prop({ required: true, unique: true })
    code: string; // IATA code

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    city: string;

    @Prop({ required: true })
    country: string;

    @Prop()
    lat: number;

    @Prop()
    lng: number;

    @Prop()
    timezone: string;
}

export const AirportSchema = SchemaFactory.createForClass(Airport);
AirportSchema.index({ code: 1 }, { unique: true });
AirportSchema.index({ name: 'text', city: 'text', code: 'text', country: 'text' });

// Airline schema
export type AirlineDocument = Airline & Document;

@Schema({ timestamps: true, collection: 'airlines' })
export class Airline {
    @Prop({ required: true, unique: true })
    code: string; // IATA code

    @Prop({ required: true })
    name: string;

    @Prop()
    logo: string;

    @Prop()
    country: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const AirlineSchema = SchemaFactory.createForClass(Airline);
AirlineSchema.index({ code: 1 }, { unique: true });
AirlineSchema.index({ name: 'text', code: 'text' });
