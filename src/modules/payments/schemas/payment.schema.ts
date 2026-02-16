// src/modules/payments/schemas/payment.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentStatus, PaymentProvider } from '../../../common/constants/roles.constant';

export type PaymentDocument = Payment & Document;

@Schema({ _id: false })
export class PaymentRefund {
    @Prop({ default: 0 })
    amount: number;

    @Prop({ enum: ['pending', 'processed', 'failed'], default: 'pending' })
    status: string;

    @Prop()
    reason: string;

    @Prop()
    processedAt: Date;

    @Prop()
    providerRefundId: string;
}

@Schema({ timestamps: true, collection: 'payments' })
export class Payment {
    @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
    booking: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Tenant', default: null })
    tenant: Types.ObjectId;

    @Prop({ enum: PaymentProvider, required: true })
    provider: PaymentProvider;

    @Prop({ unique: true, sparse: true })
    providerTransactionId: string;

    @Prop()
    providerReference: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true, default: 'USD' })
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
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ booking: 1 });
PaymentSchema.index({ user: 1, status: 1 });
PaymentSchema.index({ tenant: 1, createdAt: -1 });
PaymentSchema.index({ provider: 1, status: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
