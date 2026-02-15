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
exports.CruiseSchema = exports.Cruise = exports.CruiseCabinClass = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let CruiseCabinClass = class CruiseCabinClass {
};
exports.CruiseCabinClass = CruiseCabinClass;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], CruiseCabinClass.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], CruiseCabinClass.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], CruiseCabinClass.prototype, "availability", void 0);
exports.CruiseCabinClass = CruiseCabinClass = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], CruiseCabinClass);
let Cruise = class Cruise {
};
exports.Cruise = Cruise;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Cruise.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Cruise.prototype, "destination", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Cruise.prototype, "cruiseLine", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Cruise.prototype, "departurePort", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Cruise.prototype, "departureDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Cruise.prototype, "durationNights", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [CruiseCabinClass], default: [] }),
    __metadata("design:type", Array)
], Cruise.prototype, "cabinClasses", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Cruise.prototype, "images", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Cruise.prototype, "isAvailable", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Cruise.prototype, "description", void 0);
exports.Cruise = Cruise = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'cruises' })
], Cruise);
exports.CruiseSchema = mongoose_1.SchemaFactory.createForClass(Cruise);
exports.CruiseSchema.index({ destination: 1, departureDate: 1 });
exports.CruiseSchema.index({ cruiseLine: 1 });
exports.CruiseSchema.index({ durationNights: 1 });
exports.CruiseSchema.index({ name: 'text', destination: 'text' });
//# sourceMappingURL=cruise.schema.js.map