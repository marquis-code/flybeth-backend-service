import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemConfigDocument = SystemConfig & Document;

@Schema({ timestamps: true })
export class SystemConfig {
  @Prop({ default: 5, required: true })
  b2bCommission: number; // Percentage

  @Prop({ default: 10, required: true })
  b2cCommission: number; // Percentage

  @Prop({ type: [String], default: ['Hawaii', 'California', 'Florida'] })
  whitelistedStates: string[];

  @Prop({ default: true })
  isWhitelistingEnabled: boolean;

  @Prop({ default: 'Flybeth Global' })
  platformName: string;

  @Prop({ default: 15, required: true })
  ancillaryMargin: number; // Percentage for seats/bags
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);
