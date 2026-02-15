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
exports.PassengerSchema = exports.Passenger = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Passenger = class Passenger {
};
exports.Passenger = Passenger;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Passenger.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Passenger.prototype, "firstName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Passenger.prototype, "lastName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Passenger.prototype, "dateOfBirth", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['male', 'female', 'other'] }),
    __metadata("design:type", String)
], Passenger.prototype, "gender", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Passenger.prototype, "nationality", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Passenger.prototype, "passportNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Passenger.prototype, "passportExpiry", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Passenger.prototype, "passportCountry", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Passenger.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Passenger.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['adult', 'child', 'infant'], default: 'adult' }),
    __metadata("design:type", String)
], Passenger.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: { airline: String, number: String } }),
    __metadata("design:type", Object)
], Passenger.prototype, "frequentFlyer", void 0);
exports.Passenger = Passenger = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'passengers' })
], Passenger);
exports.PassengerSchema = mongoose_1.SchemaFactory.createForClass(Passenger);
exports.PassengerSchema.index({ user: 1 });
exports.PassengerSchema.index({ passportNumber: 1 }, { sparse: true });
exports.PassengerSchema.index({ firstName: 'text', lastName: 'text' });
//# sourceMappingURL=passenger.schema.js.map