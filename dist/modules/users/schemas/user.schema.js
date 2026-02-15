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
exports.UserSchema = exports.User = exports.FrequentFlyer = exports.UserPreferences = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const roles_constant_1 = require("../../../common/constants/roles.constant");
let UserPreferences = class UserPreferences {
};
exports.UserPreferences = UserPreferences;
__decorate([
    (0, mongoose_1.Prop)({ default: 'USD' }),
    __metadata("design:type", String)
], UserPreferences.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'en' }),
    __metadata("design:type", String)
], UserPreferences.prototype, "language", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], UserPreferences.prototype, "emailNotifications", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], UserPreferences.prototype, "pushNotifications", void 0);
exports.UserPreferences = UserPreferences = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], UserPreferences);
let FrequentFlyer = class FrequentFlyer {
};
exports.FrequentFlyer = FrequentFlyer;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], FrequentFlyer.prototype, "airline", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], FrequentFlyer.prototype, "number", void 0);
exports.FrequentFlyer = FrequentFlyer = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], FrequentFlyer);
let User = class User {
};
exports.User = User;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, lowercase: true, trim: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, select: false }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], User.prototype, "avatar", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: roles_constant_1.Role, default: roles_constant_1.Role.CUSTOMER }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Tenant', default: null }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], User.prototype, "tenant", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: UserPreferences, default: () => ({}) }),
    __metadata("design:type", UserPreferences)
], User.prototype, "preferences", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], User.prototype, "lastLogin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [FrequentFlyer], default: [] }),
    __metadata("design:type", Array)
], User.prototype, "frequentFlyers", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'Passenger' }], default: [] }),
    __metadata("design:type", Array)
], User.prototype, "savedPassengers", void 0);
__decorate([
    (0, mongoose_1.Prop)({ select: false }),
    __metadata("design:type", String)
], User.prototype, "otp", void 0);
__decorate([
    (0, mongoose_1.Prop)({ select: false }),
    __metadata("design:type", Date)
], User.prototype, "otpExpiry", void 0);
__decorate([
    (0, mongoose_1.Prop)({ select: false }),
    __metadata("design:type", String)
], User.prototype, "resetToken", void 0);
__decorate([
    (0, mongoose_1.Prop)({ select: false }),
    __metadata("design:type", Date)
], User.prototype, "resetTokenExpiry", void 0);
__decorate([
    (0, mongoose_1.Prop)({ select: false }),
    __metadata("design:type", String)
], User.prototype, "refreshToken", void 0);
exports.User = User = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'users' })
], User);
exports.UserSchema = mongoose_1.SchemaFactory.createForClass(User);
exports.UserSchema.index({ email: 1 }, { unique: true });
exports.UserSchema.index({ tenant: 1, role: 1 });
exports.UserSchema.index({ isActive: 1 });
exports.UserSchema.index({ role: 1 });
exports.UserSchema.index({ createdAt: -1 });
exports.UserSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });
//# sourceMappingURL=user.schema.js.map