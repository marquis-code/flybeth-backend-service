// src/modules/stays/schemas/room.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoomDocument = Room & Document;

@Schema({ timestamps: true })
export class Room {
    @Prop({ type: Types.ObjectId, ref: 'Stay', required: true, index: true })
    stay: Types.ObjectId;

    @Prop({ required: true })
    name: string; // e.g., "Deluxe Suite", "Standard Room"

    @Prop({ required: true })
    description: string;

    @Prop({ required: true, min: 0 })
    pricePerNight: number;

    @Prop({ required: true, min: 1 })
    capacity: number; // Max guests

    @Prop({ type: [String] })
    images: string[];

    @Prop({ type: [String] })
    amenities: string[]; // Room-specific amenities

    @Prop({ required: true, min: 0 })
    quantity: number; // Total number of rooms of this type available
}

export const RoomSchema = SchemaFactory.createForClass(Room);
