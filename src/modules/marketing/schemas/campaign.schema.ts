import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MarketingCampaignDocument = MarketingCampaign & Document;

@Schema({ timestamps: true })
export class MarketingCampaign {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenant: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  content: string; // HTML content

  @Prop()
  coverImage: string;

  @Prop({ default: 'draft', enum: ['draft', 'queued', 'sending', 'sent', 'failed'] })
  status: string;

  @Prop()
  scheduledAt: Date;

  @Prop()
  sentAt: Date;

  @Prop({ default: 0 })
  recipientCount: number;

  @Prop({ type: Object })
  filters: {
    userType?: string;
    hasBookedBefore?: boolean;
    lastActiveWithinDays?: number;
    target?: string;
    emails?: string[];
  };

  @Prop({ default: false })
  isTemplate: boolean;

  @Prop()
  templateCategory: string;
}

export const MarketingCampaignSchema = SchemaFactory.createForClass(MarketingCampaign);
