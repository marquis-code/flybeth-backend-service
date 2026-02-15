// src/common/constants/roles.constant.ts
export enum Role {
    SUPER_ADMIN = 'super_admin',
    TENANT_ADMIN = 'tenant_admin',
    AGENT = 'agent',
    CUSTOMER = 'customer',
}

export enum BookingStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    TICKETED = 'ticketed',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded',
    EXPIRED = 'expired',
}

export enum PaymentStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SUCCESS = 'success',
    FAILED = 'failed',
    REFUNDED = 'refunded',
}

export enum PaymentProvider {
    STRIPE = 'stripe',
    PAYSTACK = 'paystack',
}

export enum FlightStatus {
    SCHEDULED = 'scheduled',
    DELAYED = 'delayed',
    CANCELLED = 'cancelled',
    COMPLETED = 'completed',
}

export enum FlightClass {
    ECONOMY = 'economy',
    PREMIUM_ECONOMY = 'premium_economy',
    BUSINESS = 'business',
    FIRST = 'first',
}

export enum TenantStatus {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    PENDING = 'pending',
}

export enum NotificationType {
    BOOKING_CONFIRMED = 'booking_confirmed',
    PAYMENT_SUCCESS = 'payment_success',
    PAYMENT_FAILED = 'payment_failed',
    CANCELLATION = 'cancellation',
    REFUND_PROCESSED = 'refund_processed',
    SYSTEM = 'system',
    PROMOTION = 'promotion',
}

export enum NotificationChannel {
    EMAIL = 'email',
    PUSH = 'push',
    IN_APP = 'in_app',
}

// Paystack-supported African currencies
export const PAYSTACK_CURRENCIES = ['NGN', 'GHS', 'ZAR', 'KES', 'USD'];

// Default supported currencies
export const SUPPORTED_CURRENCIES = [
    'USD', 'EUR', 'GBP', 'NGN', 'GHS', 'ZAR', 'KES',
    'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'AED', 'SAR',
];
