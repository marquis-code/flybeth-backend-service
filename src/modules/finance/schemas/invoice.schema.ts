import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenant: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  booking: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  issuedBy: Types.ObjectId;

  @Prop({ required: true, unique: true })
  invoiceNumber: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ default: 'unpaid', enum: ['pending', 'unpaid', 'paid', 'overdue', 'cancelled'] })
  status: string;

  @Prop({ type: Object })
  items: Array<{ description: string; amount: number }>;

  @Prop()
  paidAt: Date;

  @Prop()
  notes: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
