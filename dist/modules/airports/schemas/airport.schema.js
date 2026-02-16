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
exports.AirlineSchema = exports.Airline = exports.AirportSchema = exports.Airport = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Airport = class Airport {
};
exports.Airport = Airport;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Airport.prototype, "code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Airport.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Airport.prototype, "city", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Airport.prototype, "country", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Airport.prototype, "lat", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Airport.prototype, "lng", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Airport.prototype, "timezone", void 0);
exports.Airport = Airport = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'airports' })
], Airport);
exports.AirportSchema = mongoose_1.SchemaFactory.createForClass(Airport);
exports.AirportSchema.index({ name: 'text', city: 'text', code: 'text', country: 'text' });
let Airline = class Airline {
};
exports.Airline = Airline;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Airline.prototype, "code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Airline.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Airline.prototype, "logo", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Airline.prototype, "country", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Airline.prototype, "isActive", void 0);
exports.Airline = Airline = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'airlines' })
], Airline);
exports.AirlineSchema = mongoose_1.SchemaFactory.createForClass(Airline);
exports.AirlineSchema.index({ name: 'text', code: 'text' });
//# sourceMappingURL=airport.schema.js.map