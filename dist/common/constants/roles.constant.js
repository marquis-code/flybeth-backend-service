"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_CURRENCIES = exports.PAYSTACK_CURRENCIES = exports.NotificationChannel = exports.NotificationType = exports.TenantStatus = exports.FlightClass = exports.FlightStatus = exports.PaymentProvider = exports.PaymentStatus = exports.BookingStatus = exports.Role = void 0;
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
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["PUSH"] = "push";
    NotificationChannel["IN_APP"] = "in_app";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
exports.PAYSTACK_CURRENCIES = ['NGN', 'GHS', 'ZAR', 'KES', 'USD'];
exports.SUPPORTED_CURRENCIES = [
    'USD', 'EUR', 'GBP', 'NGN', 'GHS', 'ZAR', 'KES',
    'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'AED', 'SAR',
];
//# sourceMappingURL=roles.constant.js.map