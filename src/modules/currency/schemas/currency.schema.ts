// src/modules/currency/schemas/currency.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type CurrencyDocument = Currency & Document;

@Schema({ timestamps: true })
export class Currency {
  @Prop({ required: true, unique: true, uppercase: true })
  code: string; // e.g., 'USD', 'NGN'

  @Prop({ required: true })
  name: string; // e.g., 'US Dollar', 'Nigerian Naira'

  @Prop({ required: true })
  symbol: string; // e.g., '$', '₦'

  @Prop({ required: true, type: Number })
  rateToBase: number; // How many of this currency equals 1 USD (Base)

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  marginPercentage: number; // Extra margin for revenue generation
}

export const CurrencySchema = SchemaFactory.createForClass(Currency);

CurrencySchema.index({ code: 1 });
