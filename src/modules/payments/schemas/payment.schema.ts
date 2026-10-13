// src/modules/payments/schemas/payment.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types, Schema as MongooseSchema } from "mongoose";
import {
  PaymentStatus,
  PaymentProvider,
} from "../../../common/constants/roles.constant";

export type PaymentDocument = Payment & Document;

@Schema({ _id: false })
export class PaymentRefund {
  @Prop({ default: 0 })
  amount: number;

  @Prop({ enum: ["pending", "processed", "failed"], default: "pending" })
  status: string;

  @Prop()
  reason: string;

  @Prop()
  processedAt: Date;

  @Prop()
  providerRefundId: string;
}

@Schema({ timestamps: true, collection: "payments" })
export class Payment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Booking", required: true })
  booking: Types.ObjectId;

  // Guest checkout is supported, so a payment is not always tied to an account.
  // When the booking belongs to a user we still record it (see
  // `PaymentsService.initializePayment`, which falls back to `booking.user`).
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: false, default: null })
  user: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Tenant", default: null })
  tenant: Types.ObjectId;

  @Prop({ enum: PaymentProvider, required: true })
  provider: PaymentProvider;

  @Prop({ unique: true, sparse: true })
  providerTransactionId: string;

  @Prop()
  providerReference: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: "USD" })
  currency: string;

  @Prop()
  convertedAmount: number;

  @Prop()
  convertedCurrency: string;

  @Prop()
  exchangeRate: number;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ type: PaymentRefund })
  refund: PaymentRefund;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  paidAt: Date;

  @Prop()
  callbackUrl: string;

  @Prop({ default: true })
  lockRefundToOriginal: boolean;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ booking: 1 });
PaymentSchema.index(
  { providerTransactionId: 1 },
  { unique: true, sparse: true },
);
PaymentSchema.index({ user: 1, status: 1 });
PaymentSchema.index({ tenant: 1, createdAt: -1 });
PaymentSchema.index({ provider: 1, status: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
