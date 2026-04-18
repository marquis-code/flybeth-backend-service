import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ItineraryDocument = Itinerary & Document;

@Schema({ timestamps: true })
export class ItineraryDay {
  @Prop({ required: true })
  dayNumber: number;

  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop({ type: [Object] })
  activities: any[];

  @Prop({ type: Object })
  accommodation: {
    name?: string;
    location?: string;
    checkIn?: string;
    checkOut?: string;
  };

  @Prop({ type: [Object] })
  transport: any[];
}

@Schema({ timestamps: true })
export class Itinerary {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenant: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  agent: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  destination: string;

  @Prop()
  coverImage: string;

  @Prop({ default: 'draft', enum: ['draft', 'published', 'shared'] })
  status: string;

  @Prop([ItineraryDay])
  days: ItineraryDay[];

  @Prop({ unique: true })
  shareSlug: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const ItinerarySchema = SchemaFactory.createForClass(Itinerary);
