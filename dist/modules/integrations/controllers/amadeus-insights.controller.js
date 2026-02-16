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
exports.AmadeusInsightsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const amadeus_insights_provider_1 = require("../providers/amadeus-insights.provider");
let AmadeusInsightsController = class AmadeusInsightsController {
    constructor(provider) {
        this.provider = provider;
    }
    mostTraveled(originCityCode, period, sort, max) {
        return this.provider.mostTraveledDestinations({
            originCityCode, period, sort, max: max ? +max : undefined,
        });
    }
    mostBooked(originCityCode, period) {
        return this.provider.mostBookedDestinations({ originCityCode, period });
    }
    busiestPeriod(cityCode, period, direction) {
        return this.provider.busiestTravelingPeriod({ cityCode, period, direction });
    }
};
exports.AmadeusInsightsController = AmadeusInsightsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('most-traveled'),
    (0, swagger_1.ApiOperation)({ summary: 'Flight most traveled destinations' }),
    (0, swagger_1.ApiQuery)({ name: 'originCityCode', example: 'MAD' }),
    (0, swagger_1.ApiQuery)({ name: 'period', example: '2023-11', description: 'YYYY-MM format' }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false, example: 'analytics.travelers.score' }),
    (0, swagger_1.ApiQuery)({ name: 'max', type: Number, required: false }),
    __param(0, (0, common_1.Query)('originCityCode')),
    __param(1, (0, common_1.Query)('period')),
    __param(2, (0, common_1.Query)('sort')),
    __param(3, (0, common_1.Query)('max')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number]),
    __metadata("design:returntype", void 0)
], AmadeusInsightsController.prototype, "mostTraveled", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('most-booked'),
    (0, swagger_1.ApiOperation)({ summary: 'Flight most booked destinations' }),
    (0, swagger_1.ApiQuery)({ name: 'originCityCode', example: 'NCE' }),
    (0, swagger_1.ApiQuery)({ name: 'period', example: '2023-11' }),
    __param(0, (0, common_1.Query)('originCityCode')),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AmadeusInsightsController.prototype, "mostBooked", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('busiest-period'),
    (0, swagger_1.ApiOperation)({ summary: 'Flight busiest traveling period' }),
    (0, swagger_1.ApiQuery)({ name: 'cityCode', example: 'PAR' }),
    (0, swagger_1.ApiQuery)({ name: 'period', example: '2023', description: 'YYYY format' }),
    (0, swagger_1.ApiQuery)({ name: 'direction', required: false, enum: ['ARRIVING', 'DEPARTING'] }),
    __param(0, (0, common_1.Query)('cityCode')),
    __param(1, (0, common_1.Query)('period')),
    __param(2, (0, common_1.Query)('direction')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AmadeusInsightsController.prototype, "busiestPeriod", null);
exports.AmadeusInsightsController = AmadeusInsightsController = __decorate([
    (0, swagger_1.ApiTags)('Amadeus — Market Insights'),
    (0, common_1.Controller)('amadeus/insights'),
    __metadata("design:paramtypes", [amadeus_insights_provider_1.AmadeusInsightsProvider])
], AmadeusInsightsController);
//# sourceMappingURL=amadeus-insights.controller.js.map