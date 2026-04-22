import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SystemConfigDocument = SystemConfig & Document;

@Schema({ timestamps: true })
export class SystemConfig {
  @Prop({ default: 5, required: true })
  b2bCommission: number;

  @Prop({ default: 10, required: true })
  b2cCommission: number;

  @Prop({ type: [String], default: ['Hawaii', 'California', 'Florida'] })
  whitelistedStates: string[];

  @Prop({ default: true })
  isWhitelistingEnabled: boolean;

  @Prop({ default: 'Flybeth Global' })
  platformName: string;

  @Prop({ default: 15, required: true })
  ancillaryMargin: number;

  @Prop({ 
    type: [{ currency: String, rate: Number, symbol: String }], 
    default: [] 
  })
  exchangeRates: { currency: string; rate: number; symbol: string }[];

  @Prop({ 
    type: MongooseSchema.Types.Mixed,
    default: { bags: 25, seats: 15, insurance: 12 } 
  })
  ancillaryPrices: { bags: number; seats: number; insurance: number };
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);
