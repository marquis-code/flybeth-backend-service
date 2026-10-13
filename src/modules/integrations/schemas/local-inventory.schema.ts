// src/modules/integrations/schemas/local-inventory.schema.ts
//
// Platform-owned inventory used by the "flybeth" local adapters.
//
// Why this exists:
//   The live provider landscape is volatile (Amadeus Self-Service was shut down,
//   Duffel Stays is not enabled on every account, and several partners require
//   contract-specific credentials). The platform therefore also sells its own
//   contracted inventory. These collections let hotels, transfers and activities
//   keep working — and keep the whole search → quote → book → pay funnel
//   testable — even when every external provider is unavailable.
//
// The local adapters expose this inventory through exactly the same adapter
// interfaces as the live providers, so nothing else in the booking or payment
// funnel needs to know which provider produced a result.

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type TransferInventoryDocument = TransferInventory & Document;

@Schema({ timestamps: true })
export class TransferInventory {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true, index: true })
  transferType: string; // PRIVATE | SHARED | ALL

  @Prop({ required: true })
  vehicleCode: string;

  @Prop({ required: true })
  vehicleDescription: string;

  /** IATA code of the pickup airport, e.g. "CDG". "ALL" matches every origin. */
  @Prop({ required: true, index: true, uppercase: true })
  startLocationCode: string;

  /** Free-text city the transfer serves, matched case-insensitively. */
  @Prop({ index: true })
  city: string;

  @Prop()
  countryCode: string;

  @Prop({ required: true, min: 0 })
  basePrice: number;

  @Prop({ default: "USD" })
  currency: string;

  @Prop({ default: 60 })
  durationMinutes: number;

  @Prop({ default: 3 })
  maxPassengers: number;

  @Prop({ default: 3 })
  maxLuggage: number;

  @Prop({ default: "Free cancellation up to 24 hours before pickup" })
  cancellationPolicy: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const TransferInventorySchema =
  SchemaFactory.createForClass(TransferInventory);
TransferInventorySchema.index({ startLocationCode: 1, transferType: 1 });

export type ExperienceInventoryDocument = ExperienceInventory & Document;

@Schema({ timestamps: true })
export class ExperienceInventory {
  @Prop({ required: true, index: "text" })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  shortDescription: string;

  @Prop({ required: true, index: true })
  city: string;

  @Prop()
  countryCode: string;

  @Prop({ type: Number, required: true })
  latitude: number;

  @Prop({ type: Number, required: true })
  longitude: number;

  /** Search categories/keywords used for text filtering. */
  @Prop({ type: [String], default: [] })
  categories: string[];

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: "USD" })
  currency: string;

  @Prop({ min: 0, max: 5 })
  rating: number;

  @Prop({ default: "2 hours" })
  minimumDuration: string;

  @Prop({ default: 20 })
  maxParticipants: number;

  /** Optional external booking link; when present the UI may deep-link out. */
  @Prop()
  bookingLink: string;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const ExperienceInventorySchema =
  SchemaFactory.createForClass(ExperienceInventory);
ExperienceInventorySchema.index({ latitude: 1, longitude: 1 });
