// src/modules/finance/schemas/transaction.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  CREDIT = "credit",
  DEBIT = "debit",
  REFUND = "refund",
}

export enum TransactionStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Tenant" })
  tenant: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: "USD" })
  currency: string;

  @Prop({ enum: TransactionType, required: true })
  type: TransactionType;

  @Prop({ enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Prop({ required: true, unique: true })
  reference: string;

  @Prop()
  description: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: "Booking" })
  booking: Types.ObjectId;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ reference: 1 }, { unique: true });
