export interface BnplStrategy {
  initializePayment(bookingId: string, amount: number, currency: string, metadata?: any): Promise<{ checkoutUrl: string; reference: string }>;
  verifyWebhook(payload: any, signature: string): Promise<boolean>;
  authorizePayment?(checkoutToken: string, bookingId: string, amount: number, currency: string): Promise<boolean>;
}
