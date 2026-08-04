// src/modules/integrations/interfaces/lounge-adapter.interface.ts

export interface LoungeSearchQuery {
  country?: string; // Optional filter by country ISO code
  limit?: number;
  page?: number;
}

export interface LoungeVoucher {
  productId: number;
  name: string;
  description: string;
  imageUrl?: string;
  orderQuantityLimit?: number;
  termsAndConditions?: string;
  redemptionInstructions?: string;
  categories: string;
  currencyCode: string;
  currencyName: string;
  countryName: string;
  countryCode: string;
  price: number;
  minPrice: number;
  maxPrice: number;
}

export interface LoungeSearchResult {
  provider: string;
  totalCount: number;
  vouchers: LoungeVoucher[];
}

export interface LoungeBookingRequest {
  productId: number;
  quantity: number;
  denomination: number; // Value/amount of the voucher
  email: string;
  contact: string; // Phone number
  poNumber: string; // Unique reference
  notifyAdminEmail?: number; // 0 or 1
  notifyReceiverEmail?: number; // 0 or 1
}

export interface LoungeBookingResult {
  success: boolean;
  orderId?: number;
  orderTotal?: number;
  amountCharged?: number;
  currencyCode?: string;
  orderStatus?: string; // e.g. "complete"
  deliveryStatus?: string; // e.g. "delivered"
  vouchers?: Array<{
    productId: number;
    voucherCode: string;
    pin?: string;
    validity?: string;
  }>;
  errorMessage?: string;
}

export interface LoungeOrderDetails {
  orderId: number;
  orderTotal: number;
  amountCharged: number;
  orderStatus: string;
  deliveryStatus: string;
  vouchers: Array<{
    productId: number;
    voucherCode: string;
    pin?: string;
    validity?: string;
  }>;
}

export interface LoungeBalance {
  value: number;
  currency: string;
}

export interface LoungeAdapter {
  providerName: string;
  searchLounges(query: LoungeSearchQuery): Promise<LoungeSearchResult>;
  bookLounge(request: LoungeBookingRequest): Promise<LoungeBookingResult>;
  getOrderDetails(poNumber: string): Promise<LoungeOrderDetails>;
  getBalance(): Promise<LoungeBalance>;
}
