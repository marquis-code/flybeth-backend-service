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
exports.AmadeusItineraryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const amadeus_itinerary_provider_1 = require("../providers/amadeus-itinerary.provider");
let AmadeusItineraryController = class AmadeusItineraryController {
    constructor(provider) {
        this.provider = provider;
    }
    tripPurpose(originLocationCode, destinationLocationCode, departureDate, returnDate) {
        return this.provider.tripPurposePrediction({
            originLocationCode,
            destinationLocationCode,
            departureDate,
            returnDate,
        });
    }
};
exports.AmadeusItineraryController = AmadeusItineraryController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('trip-purpose'),
    (0, swagger_1.ApiOperation)({ summary: 'Predict trip purpose (business vs leisure)' }),
    (0, swagger_1.ApiQuery)({ name: 'originLocationCode', example: 'LON' }),
    (0, swagger_1.ApiQuery)({ name: 'destinationLocationCode', example: 'AMS' }),
    (0, swagger_1.ApiQuery)({ name: 'departureDate', example: '2025-08-01' }),
    (0, swagger_1.ApiQuery)({ name: 'returnDate', example: '2025-08-05' }),
    __param(0, (0, common_1.Query)('originLocationCode')),
    __param(1, (0, common_1.Query)('destinationLocationCode')),
    __param(2, (0, common_1.Query)('departureDate')),
    __param(3, (0, common_1.Query)('returnDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], AmadeusItineraryController.prototype, "tripPurpose", null);
exports.AmadeusItineraryController = AmadeusItineraryController = __decorate([
    (0, swagger_1.ApiTags)('Amadeus — Itinerary Management'),
    (0, common_1.Controller)('amadeus/itinerary'),
    __metadata("design:paramtypes", [amadeus_itinerary_provider_1.AmadeusItineraryProvider])
], AmadeusItineraryController);
//# sourceMappingURL=amadeus-itinerary.controller.js.map