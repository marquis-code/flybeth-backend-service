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
exports.TenantSchema = exports.Tenant = exports.TenantSubscription = exports.TenantSettings = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const roles_constant_1 = require("../../../common/constants/roles.constant");
let TenantSettings = class TenantSettings {
};
exports.TenantSettings = TenantSettings;
__decorate([
    (0, mongoose_1.Prop)({ default: 'USD' }),
    __metadata("design:type", String)
], TenantSettings.prototype, "defaultCurrency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: ['USD'] }),
    __metadata("design:type", Array)
], TenantSettings.prototype, "supportedCurrencies", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0, max: 100 }),
    __metadata("design:type", Number)
], TenantSettings.prototype, "markupPercentage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0, max: 100 }),
    __metadata("design:type", Number)
], TenantSettings.prototype, "commissionPercentage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], TenantSettings.prototype, "allowB2C", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], TenantSettings.prototype, "allowB2B", void 0);
exports.TenantSettings = TenantSettings = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], TenantSettings);
let TenantSubscription = class TenantSubscription {
};
exports.TenantSubscription = TenantSubscription;
__decorate([
    (0, mongoose_1.Prop)({ enum: ['basic', 'professional', 'enterprise'], default: 'basic' }),
    __metadata("design:type", String)
], TenantSubscription.prototype, "plan", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], TenantSubscription.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], TenantSubscription.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['active', 'expired', 'cancelled'], default: 'active' }),
    __metadata("design:type", String)
], TenantSubscription.prototype, "status", void 0);
exports.TenantSubscription = TenantSubscription = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], TenantSubscription);
let Tenant = class Tenant {
};
exports.Tenant = Tenant;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Tenant.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, lowercase: true, trim: true }),
    __metadata("design:type", String)
], Tenant.prototype, "slug", void 0);
__decorate([
    (0, mongoose_1.Prop)({ unique: true, sparse: true, lowercase: true }),
    __metadata("design:type", String)
], Tenant.prototype, "domain", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Tenant.prototype, "logo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Tenant.prototype, "contactEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Tenant.prototype, "contactPhone", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Tenant.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Tenant.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: TenantSettings, default: () => ({}) }),
    __metadata("design:type", TenantSettings)
], Tenant.prototype, "settings", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: TenantSubscription, default: () => ({}) }),
    __metadata("design:type", TenantSubscription)
], Tenant.prototype, "subscription", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: roles_constant_1.TenantStatus, default: roles_constant_1.TenantStatus.PENDING }),
    __metadata("design:type", String)
], Tenant.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Tenant.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Tenant.prototype, "totalAgents", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Tenant.prototype, "totalBookings", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Tenant.prototype, "totalRevenue", void 0);
exports.Tenant = Tenant = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'tenants' })
], Tenant);
exports.TenantSchema = mongoose_1.SchemaFactory.createForClass(Tenant);
exports.TenantSchema.index({ slug: 1 }, { unique: true });
exports.TenantSchema.index({ status: 1 });
exports.TenantSchema.index({ domain: 1 }, { unique: true, sparse: true });
exports.TenantSchema.index({ createdAt: -1 });
exports.TenantSchema.index({ name: 'text', slug: 'text', domain: 'text' });
//# sourceMappingURL=tenant.schema.js.map