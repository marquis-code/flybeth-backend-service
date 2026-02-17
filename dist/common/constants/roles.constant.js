"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_CURRENCIES = exports.PAYSTACK_CURRENCIES = exports.VoiceAgentIntent = exports.ConversationRole = exports.BookingDraftStatus = exports.BookingDraftStep = exports.VoiceSessionStatus = exports.NotificationChannel = exports.NotificationType = exports.TenantStatus = exports.FlightClass = exports.FlightStatus = exports.PaymentProvider = exports.PaymentStatus = exports.BookingStatus = exports.Role = void 0;
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "super_admin";
    Role["TENANT_ADMIN"] = "tenant_admin";
    Role["AGENT"] = "agent";
    Role["CUSTOMER"] = "customer";
})(Role || (exports.Role = Role = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "pending";
    BookingStatus["CONFIRMED"] = "confirmed";
    BookingStatus["TICKETED"] = "ticketed";
    BookingStatus["CANCELLED"] = "cancelled";
    BookingStatus["REFUNDED"] = "refunded";
    BookingStatus["EXPIRED"] = "expired";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PROCESSING"] = "processing";
    PaymentStatus["SUCCESS"] = "success";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["STRIPE"] = "stripe";
    PaymentProvider["PAYSTACK"] = "paystack";
})(PaymentProvider || (exports.PaymentProvider = PaymentProvider = {}));
var FlightStatus;
(function (FlightStatus) {
    FlightStatus["SCHEDULED"] = "scheduled";
    FlightStatus["DELAYED"] = "delayed";
    FlightStatus["CANCELLED"] = "cancelled";
    FlightStatus["COMPLETED"] = "completed";
})(FlightStatus || (exports.FlightStatus = FlightStatus = {}));
var FlightClass;
(function (FlightClass) {
    FlightClass["ECONOMY"] = "economy";
    FlightClass["PREMIUM_ECONOMY"] = "premium_economy";
    FlightClass["BUSINESS"] = "business";
    FlightClass["FIRST"] = "first";
})(FlightClass || (exports.FlightClass = FlightClass = {}));
var TenantStatus;
(function (TenantStatus) {
    TenantStatus["ACTIVE"] = "active";
    TenantStatus["SUSPENDED"] = "suspended";
    TenantStatus["PENDING"] = "pending";
})(TenantStatus || (exports.TenantStatus = TenantStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["BOOKING_CONFIRMED"] = "booking_confirmed";
    NotificationType["PAYMENT_SUCCESS"] = "payment_success";
    NotificationType["PAYMENT_FAILED"] = "payment_failed";
    NotificationType["CANCELLATION"] = "cancellation";
    NotificationType["REFUND_PROCESSED"] = "refund_processed";
    NotificationType["SYSTEM"] = "system";
    NotificationType["PROMOTION"] = "promotion";
    NotificationType["BOOKING_REMINDER"] = "booking_reminder";
    NotificationType["DRAFT_ABANDONED"] = "draft_abandoned";
    NotificationType["FLIGHT_DISRUPTION"] = "flight_disruption";
    NotificationType["CHECKIN_REMINDER"] = "checkin_reminder";
    NotificationType["AI_RECOMMENDATION"] = "ai_recommendation";
    NotificationType["VOICE_SESSION"] = "voice_session";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["PUSH"] = "push";
    NotificationChannel["IN_APP"] = "in_app";
    NotificationChannel["SOCKET"] = "socket";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
var VoiceSessionStatus;
(function (VoiceSessionStatus) {
    VoiceSessionStatus["ACTIVE"] = "active";
    VoiceSessionStatus["PAUSED"] = "paused";
    VoiceSessionStatus["COMPLETED"] = "completed";
    VoiceSessionStatus["ABANDONED"] = "abandoned";
})(VoiceSessionStatus || (exports.VoiceSessionStatus = VoiceSessionStatus = {}));
var BookingDraftStep;
(function (BookingDraftStep) {
    BookingDraftStep["SEARCH"] = "search";
    BookingDraftStep["SELECT_FLIGHT"] = "select_flight";
    BookingDraftStep["SELECT_STAY"] = "select_stay";
    BookingDraftStep["SELECT_CAR"] = "select_car";
    BookingDraftStep["SELECT_CRUISE"] = "select_cruise";
    BookingDraftStep["PASSENGER_DETAILS"] = "passenger_details";
    BookingDraftStep["CONTACT_INFO"] = "contact_info";
    BookingDraftStep["REVIEW"] = "review";
    BookingDraftStep["PAYMENT"] = "payment";
    BookingDraftStep["CONFIRMED"] = "confirmed";
})(BookingDraftStep || (exports.BookingDraftStep = BookingDraftStep = {}));
var BookingDraftStatus;
(function (BookingDraftStatus) {
    BookingDraftStatus["IN_PROGRESS"] = "in_progress";
    BookingDraftStatus["COMPLETED"] = "completed";
    BookingDraftStatus["ABANDONED"] = "abandoned";
    BookingDraftStatus["EXPIRED"] = "expired";
})(BookingDraftStatus || (exports.BookingDraftStatus = BookingDraftStatus = {}));
var ConversationRole;
(function (ConversationRole) {
    ConversationRole["USER"] = "user";
    ConversationRole["ASSISTANT"] = "assistant";
    ConversationRole["SYSTEM"] = "system";
})(ConversationRole || (exports.ConversationRole = ConversationRole = {}));
var VoiceAgentIntent;
(function (VoiceAgentIntent) {
    VoiceAgentIntent["SEARCH_FLIGHT"] = "search_flight";
    VoiceAgentIntent["SEARCH_STAY"] = "search_stay";
    VoiceAgentIntent["SEARCH_CAR"] = "search_car";
    VoiceAgentIntent["SEARCH_CRUISE"] = "search_cruise";
    VoiceAgentIntent["SEARCH_PACKAGE"] = "search_package";
    VoiceAgentIntent["SELECT_OPTION"] = "select_option";
    VoiceAgentIntent["ADD_PASSENGER"] = "add_passenger";
    VoiceAgentIntent["SET_CONTACT"] = "set_contact";
    VoiceAgentIntent["CONFIRM_BOOKING"] = "confirm_booking";
    VoiceAgentIntent["CHECK_STATUS"] = "check_status";
    VoiceAgentIntent["CANCEL_BOOKING"] = "cancel_booking";
    VoiceAgentIntent["GET_HELP"] = "get_help";
    VoiceAgentIntent["GET_RECOMMENDATIONS"] = "get_recommendations";
    VoiceAgentIntent["GENERAL_QUERY"] = "general_query";
    VoiceAgentIntent["UNKNOWN"] = "unknown";
})(VoiceAgentIntent || (exports.VoiceAgentIntent = VoiceAgentIntent = {}));
exports.PAYSTACK_CURRENCIES = ['NGN', 'GHS', 'ZAR', 'KES', 'USD'];
exports.SUPPORTED_CURRENCIES = [
    'USD', 'EUR', 'GBP', 'NGN', 'GHS', 'ZAR', 'KES',
    'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'AED', 'SAR',
];
//# sourceMappingURL=roles.constant.js.map