// src/modules/currency/schemas/exchange-rate.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExchangeRateDocument = ExchangeRate & Document;

@Schema({ timestamps: true, collection: 'exchange_rates' })
export class ExchangeRate {
    @Prop({ required: true })
    baseCurrency: string;

    @Prop({ type: Map, of: Number, required: true })
    rates: Map<string, number>;

    @Prop({ required: true })
    fetchedAt: Date;
}

export const ExchangeRateSchema = SchemaFactory.createForClass(ExchangeRate);

ExchangeRateSchema.index({ baseCurrency: 1, fetchedAt: -1 });
