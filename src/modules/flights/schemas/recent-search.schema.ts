// src/modules/flights/schemas/recent-search.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type RecentSearchDocument = RecentSearch & Document;

@Schema({ timestamps: true })
export class RecentSearch {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: string;

  @Prop({ type: Object, required: true })
  criteria: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children: number;
    infants: number;
    cabinClass: string;
    flightMode: string;
  };

  @Prop({ default: 1 })
  searchCount: number;
}

export const RecentSearchSchema = SchemaFactory.createForClass(RecentSearch);

// Index to expire old searches after 30 days
RecentSearchSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 });
// Compound index for user/criteria deduplication
RecentSearchSchema.index({ userId: 1, 'criteria.origin': 1, 'criteria.destination': 1 }, { unique: false });
