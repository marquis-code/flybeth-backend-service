import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContactInquiryDocument = ContactInquiry & Document;

@Schema({ timestamps: true })
export class ContactInquiry {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  subject: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenant: Types.ObjectId;

  @Prop({ default: 'new', enum: ['new', 'read', 'replied', 'archived'] })
  status: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>; // e.g., browser, IP, page URL
}

export const ContactInquirySchema = SchemaFactory.createForClass(ContactInquiry);
