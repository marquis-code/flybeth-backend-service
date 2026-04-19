import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NewsletterSubscriptionDocument = NewsletterSubscription & Document;

@Schema({ timestamps: true })
export class NewsletterSubscription {
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenant: Types.ObjectId;

  @Prop({ default: 'active', enum: ['active', 'unsubscribed'] })
  status: string;

  @Prop()
  source?: string; // e.g., 'footer', 'popup', 'checkout'
}

export const NewsletterSubscriptionSchema = SchemaFactory.createForClass(NewsletterSubscription);
NewsletterSubscriptionSchema.index({ email: 1, tenant: 1 }, { unique: true });
