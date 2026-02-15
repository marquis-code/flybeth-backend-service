"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingSchema = exports.Booking = exports.BookingCancellation = exports.BookingPayment = exports.BookingPricing = exports.BookingContact = exports.BookingCruise = exports.BookingCar = exports.BookingStay = exports.BookingFlight = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const roles_constant_1 = require("../../../common/constants/roles.constant");
let BookingFlight = class BookingFlight {
};
exports.BookingFlight = BookingFlight;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Flight', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], BookingFlight.prototype, "flight", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], BookingFlight.prototype, "class", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'Passenger' }], default: [] }),
    __metadata("design:type", Array)
], BookingFlight.prototype, "passengers", void 0);
exports.BookingFlight = BookingFlight = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], BookingFlight);
let BookingStay = class BookingStay {
};
exports.BookingStay = BookingStay;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Stay', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], BookingStay.prototype, "stay", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Room', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], BookingStay.prototype, "room", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], BookingStay.prototype, "checkIn", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], BookingStay.prototype, "checkOut", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: true }),
    __metadata("design:type", Object)
], BookingStay.prototype, "occupancy", void 0);
exports.BookingStay = BookingStay = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], BookingStay);
let BookingCar = class BookingCar {
};
exports.BookingCar = BookingCar;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], BookingCar.prototype, "car", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], BookingCar.prototype, "pickUpDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], BookingCar.prototype, "dropOffDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BookingCar.prototype, "pickUpLocation", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BookingCar.prototype, "dropOffLocation", void 0);
exports.BookingCar = BookingCar = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], BookingCar);
let BookingCruise = class BookingCruise {
};
exports.BookingCruise = BookingCruise;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Cruise', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], BookingCruise.prototype, "cruise", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], BookingCruise.prototype, "cabinType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], BookingCruise.prototype, "departureDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'Passenger' }], default: [] }),
    __metadata("design:type", Array)
], BookingCruise.prototype, "passengers", void 0);
exports.BookingCruise = BookingCruise = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], BookingCruise);
let BookingContact = class BookingContact {
};
exports.BookingContact = BookingContact;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], BookingContact.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], BookingContact.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BookingContact.prototype, "name", void 0);
exports.BookingContact = BookingContact = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], BookingContact);
let BookingPricing = class BookingPricing {
};
exports.BookingPricing = BookingPricing;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], BookingPricing.prototype, "baseFare", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], BookingPricing.prototype, "taxes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], BookingPricing.prototype, "fees", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], BookingPricing.prototype, "tenantMarkup", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], BookingPricing.prototype, "discount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], BookingPricing.prototype, "totalAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'USD' }),
    __metadata("design:type", String)
], BookingPricing.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BookingPricing.prototype, "originalCurrency", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], BookingPricing.prototype, "originalAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], BookingPricing.prototype, "exchangeRate", void 0);
exports.BookingPricing = BookingPricing = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], BookingPricing);
let BookingPayment = class BookingPayment {
};
exports.BookingPayment = BookingPayment;
__decorate([
    (0, mongoose_1.Prop)({ enum: roles_constant_1.PaymentStatus, default: roles_constant_1.PaymentStatus.PENDING }),
    __metadata("design:type", String)
], BookingPayment.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BookingPayment.prototype, "method", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BookingPayment.prototype, "transactionId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BookingPayment.prototype, "provider", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], BookingPayment.prototype, "paidAt", void 0);
exports.BookingPayment = BookingPayment = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], BookingPayment);
let BookingCancellation = class BookingCancellation {
};
exports.BookingCancellation = BookingCancellation;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BookingCancellation.prototype, "reason", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], BookingCancellation.prototype, "cancelledAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], BookingCancellation.prototype, "refundAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['pending', 'processed', 'failed'], default: 'pending' }),
    __metadata("design:type", String)
], BookingCancellation.prototype, "refundStatus", void 0);
exports.BookingCancellation = BookingCancellation = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], BookingCancellation);
let Booking = class Booking {
};
exports.Booking = Booking;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Booking.prototype, "pnr", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Tenant', default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "tenant", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Package', default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Booking.prototype, "package", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [BookingFlight], default: [] }),
    __metadata("design:type", Array)
], Booking.prototype, "flights", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [BookingStay], default: [] }),
    __metadata("design:type", Array)
], Booking.prototype, "stays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [BookingCar], default: [] }),
    __metadata("design:type", Array)
], Booking.prototype, "cars", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [BookingCruise], default: [] }),
    __metadata("design:type", Array)
], Booking.prototype, "cruises", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: BookingContact, required: true }),
    __metadata("design:type", BookingContact)
], Booking.prototype, "contactDetails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: BookingPricing, required: true }),
    __metadata("design:type", BookingPricing)
], Booking.prototype, "pricing", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: BookingPayment, default: () => ({}) }),
    __metadata("design:type", BookingPayment)
], Booking.prototype, "payment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: roles_constant_1.BookingStatus, default: roles_constant_1.BookingStatus.PENDING }),
    __metadata("design:type", String)
], Booking.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: BookingCancellation }),
    __metadata("design:type", BookingCancellation)
], Booking.prototype, "cancellation", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Booking.prototype, "expiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], Booking.prototype, "bookedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Booking.prototype, "notes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 1 }),
    __metadata("design:type", Number)
], Booking.prototype, "totalPassengers", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Booking.prototype, "isRoundTrip", void 0);
exports.Booking = Booking = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'bookings' })
], Booking);
exports.BookingSchema = mongoose_1.SchemaFactory.createForClass(Booking);
exports.BookingSchema.index({ pnr: 1 }, { unique: true });
exports.BookingSchema.index({ user: 1, status: 1 });
exports.BookingSchema.index({ tenant: 1, status: 1 });
exports.BookingSchema.index({ status: 1, expiresAt: 1 });
exports.BookingSchema.index({ bookedAt: -1 });
exports.BookingSchema.index({ 'payment.status': 1 });
exports.BookingSchema.index({ tenant: 1, bookedAt: -1 });
exports.BookingSchema.index({ user: 1, bookedAt: -1 });
exports.BookingSchema.index({ pnr: 'text' });
//# sourceMappingURL=booking.schema.js.map