export declare class InitializePaymentDto {
    bookingId: string;
    currency: string;
    callbackUrl?: string;
    provider?: string;
}
export declare class RefundPaymentDto {
    amount?: number;
    reason: string;
}
