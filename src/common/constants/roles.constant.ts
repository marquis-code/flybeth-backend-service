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
    BOOKING_REMINDER = 'booking_reminder',
    DRAFT_ABANDONED = 'draft_abandoned',
    FLIGHT_DISRUPTION = 'flight_disruption',
    CHECKIN_REMINDER = 'checkin_reminder',
    AI_RECOMMENDATION = 'ai_recommendation',
    VOICE_SESSION = 'voice_session',
}

export enum NotificationChannel {
    EMAIL = 'email',
    PUSH = 'push',
    IN_APP = 'in_app',
    SOCKET = 'socket',
}

export enum VoiceSessionStatus {
    ACTIVE = 'active',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    ABANDONED = 'abandoned',
}

export enum BookingDraftStep {
    SEARCH = 'search',
    SELECT_FLIGHT = 'select_flight',
    SELECT_STAY = 'select_stay',
    SELECT_CAR = 'select_car',
    SELECT_CRUISE = 'select_cruise',
    PASSENGER_DETAILS = 'passenger_details',
    CONTACT_INFO = 'contact_info',
    REVIEW = 'review',
    PAYMENT = 'payment',
    CONFIRMED = 'confirmed',
}

export enum BookingDraftStatus {
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    ABANDONED = 'abandoned',
    EXPIRED = 'expired',
}

export enum ConversationRole {
    USER = 'user',
    ASSISTANT = 'assistant',
    SYSTEM = 'system',
}

export enum VoiceAgentIntent {
    SEARCH_FLIGHT = 'search_flight',
    SEARCH_STAY = 'search_stay',
    SEARCH_CAR = 'search_car',
    SEARCH_CRUISE = 'search_cruise',
    SEARCH_PACKAGE = 'search_package',
    SELECT_OPTION = 'select_option',
    ADD_PASSENGER = 'add_passenger',
    SET_CONTACT = 'set_contact',
    CONFIRM_BOOKING = 'confirm_booking',
    CHECK_STATUS = 'check_status',
    CANCEL_BOOKING = 'cancel_booking',
    GET_HELP = 'get_help',
    GET_RECOMMENDATIONS = 'get_recommendations',
    GENERAL_QUERY = 'general_query',
    UNKNOWN = 'unknown',
}

// Paystack-supported African currencies
export const PAYSTACK_CURRENCIES = ['NGN', 'GHS', 'ZAR', 'KES', 'USD'];

// Default supported currencies
export const SUPPORTED_CURRENCIES = [
    'USD', 'EUR', 'GBP', 'NGN', 'GHS', 'ZAR', 'KES',
    'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'AED', 'SAR',
];
