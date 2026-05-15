// src/common/constants/roles.constant.ts
export enum Role {
  SUPER_ADMIN = "super_admin",
  TENANT_ADMIN = "tenant_admin",
  AGENT = "agent",
  CUSTOMER = "customer",
  STAFF = "staff",
}

export enum Permission {
  // General
  MANAGE_BOOKINGS = "manage_bookings",
  MANAGE_STAFF = "manage_staff",
  VIEW_REPORTS = "view_reports",
  MANAGE_INTEGRATIONS = "manage_integrations",
  MANAGE_SETTINGS = "manage_settings",

  // Real-time
  CHAT_WITH_CUSTOMERS = "chat_with_customers",
  CHAT_WITH_AGENTS = "chat_with_agents",

  // Admin Specific
  MANAGE_COMMISSIONS = "manage_commissions",
  MANAGE_CAMPAIGNS = "manage_campaigns",
  INVITE_MEMBERS = "invite_members",
  MANAGE_ROLES = "manage_roles",
  MANAGE_TENANTS = "manage_tenants",
  MANAGE_AIRPORTS = "manage_airports",
  MANAGE_AIRLINES = "manage_airlines",
  SYSTEM_ANALYTICS = "system_analytics",
}

export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  TICKETED = "ticketed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
  EXPIRED = "expired",
}

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SUCCESS = "success",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum PaymentProvider {
  STRIPE = "stripe",
  PAYSTACK = "paystack",
  MANUAL = "manual",
  WALLET = "wallet",
  CREDPAL = "credpal",
  AFFIRM = "affirm",
  KLARNA = "klarna",
  PAYPAL_FOUR = "paypal_four",
}

export enum FlightStatus {
  SCHEDULED = "scheduled",
  DELAYED = "delayed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

export enum FlightClass {
  ECONOMY = "economy",
  PREMIUM_ECONOMY = "premium_economy",
  BUSINESS = "business",
  FIRST = "first",
}

export enum TenantStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  PENDING = "pending",
  UNDER_REVIEW = "under_review",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum AgentStatus {
  PENDING = "pending",
  UNDER_REVIEW = "under_review",
  APPROVED = "approved",
  REJECTED = "rejected",
  SUSPENDED = "suspended",
}

export enum AgentTier {
  BASIC = "basic",
  VERIFIED = "verified",
  PREMIUM = "premium",
}

export enum NotificationType {
  BOOKING_CONFIRMED = "booking_confirmed",
  PAYMENT_SUCCESS = "payment_success",
  PAYMENT_FAILED = "payment_failed",
  CANCELLATION = "cancellation",
  REFUND_PROCESSED = "refund_processed",
  SYSTEM = "system",
  PROMOTION = "promotion",
}

export enum NotificationChannel {
  EMAIL = "email",
  PUSH = "push",
  IN_APP = "in_app",
}

// Paystack-supported African currencies
export const PAYSTACK_CURRENCIES = ["NGN", "GHS", "ZAR", "KES", "USD"];

// Default supported currencies
export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "NGN",
  "GHS",
  "ZAR",
  "KES",
  "CAD",
  "AUD",
  "JPY",
  "CNY",
  "INR",
  "AED",
  "SAR",
];
