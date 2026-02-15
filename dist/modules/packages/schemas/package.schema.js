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
exports.PackageSchema = exports.Package = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Package = class Package {
};
exports.Package = Package;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: 'text' }),
    __metadata("design:type", String)
], Package.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Package.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)([String]),
    __metadata("design:type", Array)
], Package.prototype, "images", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Flight' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Package.prototype, "flight", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Stay' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Package.prototype, "stay", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Car' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Package.prototype, "car", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['hotel+flight', 'hotel+flight+car', 'flight+car', 'hotel+car'] }),
    __metadata("design:type", String)
], Package.prototype, "packageType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Package.prototype, "basePrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, max: 100 }),
    __metadata("design:type", Number)
], Package.prototype, "discountPercentage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Package.prototype, "totalPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Package.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Package.prototype, "validFrom", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Package.prototype, "validUntil", void 0);
exports.Package = Package = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Package);
exports.PackageSchema = mongoose_1.SchemaFactory.createForClass(Package);
exports.PackageSchema.index({ totalPrice: 1 });
//# sourceMappingURL=package.schema.js.map