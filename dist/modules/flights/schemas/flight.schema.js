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
exports.FlightSchema = exports.Flight = exports.StopDetail = exports.FlightClassDetail = exports.AirportDetail = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const roles_constant_1 = require("../../../common/constants/roles.constant");
let AirportDetail = class AirportDetail {
};
exports.AirportDetail = AirportDetail;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AirportDetail.prototype, "airport", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AirportDetail.prototype, "city", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AirportDetail.prototype, "country", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AirportDetail.prototype, "terminal", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], AirportDetail.prototype, "gate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], AirportDetail.prototype, "time", void 0);
exports.AirportDetail = AirportDetail = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], AirportDetail);
let FlightClassDetail = class FlightClassDetail {
};
exports.FlightClassDetail = FlightClassDetail;
__decorate([
    (0, mongoose_1.Prop)({ enum: roles_constant_1.FlightClass, required: true }),
    __metadata("design:type", String)
], FlightClassDetail.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], FlightClassDetail.prototype, "basePrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'USD' }),
    __metadata("design:type", String)
], FlightClassDetail.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], FlightClassDetail.prototype, "seatsAvailable", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], FlightClassDetail.prototype, "seatsTotal", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], FlightClassDetail.prototype, "baggage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], FlightClassDetail.prototype, "amenities", void 0);
exports.FlightClassDetail = FlightClassDetail = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], FlightClassDetail);
let StopDetail = class StopDetail {
};
exports.StopDetail = StopDetail;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], StopDetail.prototype, "airport", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], StopDetail.prototype, "city", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], StopDetail.prototype, "arrivalTime", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], StopDetail.prototype, "departureTime", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], StopDetail.prototype, "duration", void 0);
exports.StopDetail = StopDetail = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], StopDetail);
let Flight = class Flight {
};
exports.Flight = Flight;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Flight.prototype, "airline", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Flight.prototype, "flightNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Flight.prototype, "aircraft", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: AirportDetail, required: true }),
    __metadata("design:type", AirportDetail)
], Flight.prototype, "departure", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: AirportDetail, required: true }),
    __metadata("design:type", AirportDetail)
], Flight.prototype, "arrival", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Flight.prototype, "duration", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Flight.prototype, "stops", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [StopDetail], default: [] }),
    __metadata("design:type", Array)
], Flight.prototype, "stopDetails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [FlightClassDetail], required: true }),
    __metadata("design:type", Array)
], Flight.prototype, "classes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: roles_constant_1.FlightStatus, default: roles_constant_1.FlightStatus.SCHEDULED }),
    __metadata("design:type", String)
], Flight.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Tenant', default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Flight.prototype, "tenant", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Flight.prototype, "isFeatured", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Flight.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Array)
], Flight.prototype, "operatingDays", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Flight.prototype, "validFrom", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Flight.prototype, "validUntil", void 0);
exports.Flight = Flight = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'flights' })
], Flight);
exports.FlightSchema = mongoose_1.SchemaFactory.createForClass(Flight);
exports.FlightSchema.index({ 'departure.airport': 1, 'arrival.airport': 1, 'departure.time': 1 });
exports.FlightSchema.index({ airline: 1 });
exports.FlightSchema.index({ flightNumber: 1 });
exports.FlightSchema.index({ status: 1, isActive: 1 });
exports.FlightSchema.index({ tenant: 1 });
exports.FlightSchema.index({ 'classes.basePrice': 1 });
exports.FlightSchema.index({ stops: 1 });
exports.FlightSchema.index({ 'departure.time': 1 });
exports.FlightSchema.index({ isFeatured: 1, isActive: 1 });
exports.FlightSchema.index({
    airline: 'text',
    flightNumber: 'text',
    'departure.city': 'text',
    'arrival.city': 'text',
    'departure.airport': 'text',
    'arrival.airport': 'text',
});
//# sourceMappingURL=flight.schema.js.map