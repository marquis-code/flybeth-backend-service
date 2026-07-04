import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubscriberDocument = Subscriber & Document;

@Schema({ timestamps: true })
export class Subscriber {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  source: string; // e.g., 'modal', 'footer'
}

export const SubscriberSchema = SchemaFactory.createForClass(Subscriber);
