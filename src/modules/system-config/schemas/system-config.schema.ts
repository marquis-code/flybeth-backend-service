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
    default: {
      domestic: {
        b2cType: 'percentage',
        b2cValue: 10,
        b2bType: 'percentage',
        b2bValue: 5,
        marginType: 'percentage',
        marginValue: 15,
      },
      international: {
        b2cType: 'percentage',
        b2cValue: 10,
        b2bType: 'percentage',
        b2bValue: 5,
        marginType: 'percentage',
        marginValue: 15,
      },
    },
  })
  flightFees: {
    domestic: {
      b2cType: 'percentage' | 'fixed';
      b2cValue: number;
      b2bType: 'percentage' | 'fixed';
      b2bValue: number;
      marginType: 'percentage' | 'fixed';
      marginValue: number;
    };
    international: {
      b2cType: 'percentage' | 'fixed';
      b2cValue: number;
      b2bType: 'percentage' | 'fixed';
      b2bValue: number;
      marginType: 'percentage' | 'fixed';
      marginValue: number;
    };
  };

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

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {
      enabled: false,
      programName: 'Flybeth Rewards',
      maxDiscountPercent: 0,
      maxDiscountCap: 0,
      pointsPerDollar: 0,
      benefits: [],
    },
  })
  rewards: {
    enabled: boolean;
    programName: string;
    maxDiscountPercent: number;
    maxDiscountCap: number;
    pointsPerDollar: number;
    benefits: string[];
  };
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);
