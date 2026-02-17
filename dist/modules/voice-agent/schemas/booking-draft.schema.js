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
exports.BookingDraftSchema = exports.BookingDraft = exports.DraftContact = exports.DraftPassenger = exports.DraftSelectedCar = exports.DraftSelectedStay = exports.DraftSelectedFlight = exports.DraftSearchCriteria = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const roles_constant_1 = require("../../../common/constants/roles.constant");
let DraftSearchCriteria = class DraftSearchCriteria {
};
exports.DraftSearchCriteria = DraftSearchCriteria;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftSearchCriteria.prototype, "origin", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftSearchCriteria.prototype, "destination", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftSearchCriteria.prototype, "departureDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftSearchCriteria.prototype, "returnDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1 }),
    __metadata("design:type", Number)
], DraftSearchCriteria.prototype, "adults", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], DraftSearchCriteria.prototype, "children", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], DraftSearchCriteria.prototype, "infants", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'economy' }),
    __metadata("design:type", String)
], DraftSearchCriteria.prototype, "travelClass", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], DraftSearchCriteria.prototype, "isRoundTrip", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], DraftSearchCriteria.prototype, "maxPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftSearchCriteria.prototype, "preferredAirline", void 0);
exports.DraftSearchCriteria = DraftSearchCriteria = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], DraftSearchCriteria);
let DraftSelectedFlight = class DraftSelectedFlight {
};
exports.DraftSelectedFlight = DraftSelectedFlight;
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: true }),
    __metadata("design:type", Object)
], DraftSelectedFlight.prototype, "flightData", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftSelectedFlight.prototype, "flightId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], DraftSelectedFlight.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftSelectedFlight.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftSelectedFlight.prototype, "travelClass", void 0);
exports.DraftSelectedFlight = DraftSelectedFlight = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], DraftSelectedFlight);
let DraftSelectedStay = class DraftSelectedStay {
};
exports.DraftSelectedStay = DraftSelectedStay;
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: true }),
    __metadata("design:type", Object)
], DraftSelectedStay.prototype, "stayData", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftSelectedStay.prototype, "stayId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftSelectedStay.prototype, "roomId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftSelectedStay.prototype, "checkIn", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftSelectedStay.prototype, "checkOut", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], DraftSelectedStay.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftSelectedStay.prototype, "currency", void 0);
exports.DraftSelectedStay = DraftSelectedStay = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], DraftSelectedStay);
let DraftSelectedCar = class DraftSelectedCar {
};
exports.DraftSelectedCar = DraftSelectedCar;
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: true }),
    __metadata("design:type", Object)
], DraftSelectedCar.prototype, "carData", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftSelectedCar.prototype, "carId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftSelectedCar.prototype, "pickUpDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftSelectedCar.prototype, "dropOffDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], DraftSelectedCar.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftSelectedCar.prototype, "currency", void 0);
exports.DraftSelectedCar = DraftSelectedCar = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], DraftSelectedCar);
let DraftPassenger = class DraftPassenger {
};
exports.DraftPassenger = DraftPassenger;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftPassenger.prototype, "firstName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftPassenger.prototype, "lastName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftPassenger.prototype, "dateOfBirth", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftPassenger.prototype, "passportNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftPassenger.prototype, "nationality", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'adult' }),
    __metadata("design:type", String)
], DraftPassenger.prototype, "type", void 0);
exports.DraftPassenger = DraftPassenger = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], DraftPassenger);
let DraftContact = class DraftContact {
};
exports.DraftContact = DraftContact;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftContact.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftContact.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], DraftContact.prototype, "name", void 0);
exports.DraftContact = DraftContact = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], DraftContact);
let BookingDraft = class BookingDraft {
};
exports.BookingDraft = BookingDraft;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], BookingDraft.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: roles_constant_1.BookingDraftStatus, default: roles_constant_1.BookingDraftStatus.IN_PROGRESS }),
    __metadata("design:type", String)
], BookingDraft.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: roles_constant_1.BookingDraftStep, default: roles_constant_1.BookingDraftStep.SEARCH }),
    __metadata("design:type", String)
], BookingDraft.prototype, "currentStep", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: DraftSearchCriteria, default: () => ({}) }),
    __metadata("design:type", DraftSearchCriteria)
], BookingDraft.prototype, "searchCriteria", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [DraftSelectedFlight], default: [] }),
    __metadata("design:type", Array)
], BookingDraft.prototype, "selectedFlights", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [DraftSelectedStay], default: [] }),
    __metadata("design:type", Array)
], BookingDraft.prototype, "selectedStays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [DraftSelectedCar], default: [] }),
    __metadata("design:type", Array)
], BookingDraft.prototype, "selectedCars", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], BookingDraft.prototype, "selectedCruises", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [DraftPassenger], default: [] }),
    __metadata("design:type", Array)
], BookingDraft.prototype, "passengerDetails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: DraftContact }),
    __metadata("design:type", DraftContact)
], BookingDraft.prototype, "contactDetails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], BookingDraft.prototype, "pricing", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], BookingDraft.prototype, "searchResults", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], BookingDraft.prototype, "lastInteractionAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'VoiceSession' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], BookingDraft.prototype, "voiceSessionId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BookingDraft.prototype, "bookingId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], BookingDraft.prototype, "pnr", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], BookingDraft.prototype, "expiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], BookingDraft.prototype, "metadata", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], BookingDraft.prototype, "completedSteps", void 0);
exports.BookingDraft = BookingDraft = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'booking_drafts' })
], BookingDraft);
exports.BookingDraftSchema = mongoose_1.SchemaFactory.createForClass(BookingDraft);
exports.BookingDraftSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.BookingDraftSchema.index({ user: 1, status: 1 });
exports.BookingDraftSchema.index({ lastInteractionAt: 1 });
exports.BookingDraftSchema.index({ createdAt: -1 });
//# sourceMappingURL=booking-draft.schema.js.map