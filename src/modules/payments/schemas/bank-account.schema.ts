// src/modules/payments/schemas/bank-account.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type BankAccountDocument = BankAccount & Document;

@Schema({ timestamps: true, collection: "bank_accounts" })
export class BankAccount {
  @Prop({ required: true, trim: true })
  bankName: string;

  @Prop({ required: true, unique: true, trim: true })
  accountNumber: string;

  @Prop({ required: true, trim: true })
  accountName: string;

  @Prop({ required: true, uppercase: true, default: "NGN" })
  currency: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  beneficiaryName: string;

  @Prop()
  logo: string;
}

export const BankAccountSchema = SchemaFactory.createForClass(BankAccount);

BankAccountSchema.index({ currency: 1, isActive: 1 });
