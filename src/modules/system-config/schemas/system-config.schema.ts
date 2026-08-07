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

  @Prop({ type: MongooseSchema.Types.Mixed, default: [] })
  exchangeRates: any[];

  @Prop({ default: 15, required: true })
  ancillaryMargin: number;

  @Prop({ 
    type: MongooseSchema.Types.Mixed,
    default: { bags: 25, seats: 15, insurance: 12, vipSupport: 15 } 
  })
  ancillaryPrices: { bags: number; seats: number; insurance: number; vipSupport: number };

  @Prop({ type: MongooseSchema.Types.Mixed, default: [] })
  bankAccounts: { 
    currency: string; 
    accountName: string; 
    accountNumber: string; 
    bankName: string;
    instructions?: string;
  }[];
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);
