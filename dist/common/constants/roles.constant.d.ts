export declare enum Role {
    SUPER_ADMIN = "super_admin",
    TENANT_ADMIN = "tenant_admin",
    AGENT = "agent",
    CUSTOMER = "customer"
}
export declare enum BookingStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    TICKETED = "ticketed",
    CANCELLED = "cancelled",
    REFUNDED = "refunded",
    EXPIRED = "expired"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    SUCCESS = "success",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare enum PaymentProvider {
    STRIPE = "stripe",
    PAYSTACK = "paystack"
}
export declare enum FlightStatus {
    SCHEDULED = "scheduled",
    DELAYED = "delayed",
    CANCELLED = "cancelled",
    COMPLETED = "completed"
}
export declare enum FlightClass {
    ECONOMY = "economy",
    PREMIUM_ECONOMY = "premium_economy",
    BUSINESS = "business",
    FIRST = "first"
}
export declare enum TenantStatus {
    ACTIVE = "active",
    SUSPENDED = "suspended",
    PENDING = "pending"
}
export declare enum NotificationType {
    BOOKING_CONFIRMED = "booking_confirmed",
    PAYMENT_SUCCESS = "payment_success",
    PAYMENT_FAILED = "payment_failed",
    CANCELLATION = "cancellation",
    REFUND_PROCESSED = "refund_processed",
    SYSTEM = "system",
    PROMOTION = "promotion"
}
export declare enum NotificationChannel {
    EMAIL = "email",
    PUSH = "push",
    IN_APP = "in_app"
}
export declare const PAYSTACK_CURRENCIES: string[];
export declare const SUPPORTED_CURRENCIES: string[];
