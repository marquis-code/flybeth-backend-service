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
exports.ExchangeRateSchema = exports.ExchangeRate = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let ExchangeRate = class ExchangeRate {
};
exports.ExchangeRate = ExchangeRate;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ExchangeRate.prototype, "baseCurrency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Map, of: Number, required: true }),
    __metadata("design:type", Map)
], ExchangeRate.prototype, "rates", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], ExchangeRate.prototype, "fetchedAt", void 0);
exports.ExchangeRate = ExchangeRate = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'exchange_rates' })
], ExchangeRate);
exports.ExchangeRateSchema = mongoose_1.SchemaFactory.createForClass(ExchangeRate);
exports.ExchangeRateSchema.index({ baseCurrency: 1, fetchedAt: -1 });
//# sourceMappingURL=exchange-rate.schema.js.map