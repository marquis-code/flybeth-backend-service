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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const currency_service_1 = require("./currency.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let CurrencyController = class CurrencyController {
    constructor(currencyService) {
        this.currencyService = currencyService;
    }
    getRates(base) {
        return this.currencyService.getExchangeRates(base || 'USD');
    }
    convert(amount, from, to) {
        return this.currencyService.convert(parseFloat(amount), from?.toUpperCase() || 'USD', to?.toUpperCase() || 'USD');
    }
    getSupportedCurrencies() {
        return this.currencyService.getSupportedCurrencies();
    }
};
exports.CurrencyController = CurrencyController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('rates'),
    (0, swagger_1.ApiOperation)({ summary: 'Get exchange rates for a base currency' }),
    __param(0, (0, common_1.Query)('base')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CurrencyController.prototype, "getRates", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('convert'),
    (0, swagger_1.ApiOperation)({ summary: 'Convert amount between currencies' }),
    __param(0, (0, common_1.Query)('amount')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], CurrencyController.prototype, "convert", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('supported'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of supported currencies' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CurrencyController.prototype, "getSupportedCurrencies", null);
exports.CurrencyController = CurrencyController = __decorate([
    (0, swagger_1.ApiTags)('Currency'),
    (0, common_1.Controller)('currency'),
    __metadata("design:paramtypes", [currency_service_1.CurrencyService])
], CurrencyController);
//# sourceMappingURL=currency.controller.js.map