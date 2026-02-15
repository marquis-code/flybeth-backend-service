import { Document, Types } from 'mongoose';
import { PaymentStatus, PaymentProvider } from '../../../common/constants/roles.constant';
export type PaymentDocument = Payment & Document;
export declare class PaymentRefund {
    amount: number;
    status: string;
    reason: string;
    processedAt: Date;
    providerRefundId: string;
}
export declare class Payment {
    booking: Types.ObjectId;
    user: Types.ObjectId;
    tenant: Types.ObjectId;
    provider: PaymentProvider;
    providerTransactionId: string;
    providerReference: string;
    amount: number;
    currency: string;
    convertedAmount: number;
    convertedCurrency: string;
    exchangeRate: number;
    status: PaymentStatus;
    refund: PaymentRefund;
    metadata: Record<string, any>;
    paidAt: Date;
    callbackUrl: string;
}
export declare const PaymentSchema: import("mongoose").Schema<Payment, import("mongoose").Model<Payment, any, any, any, Document<unknown, any, Payment, any, {}> & Payment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Payment, Document<unknown, {}, import("mongoose").FlatRecord<Payment>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Payment> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
