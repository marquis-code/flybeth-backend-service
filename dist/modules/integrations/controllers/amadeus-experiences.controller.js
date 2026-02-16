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
exports.AmadeusExperiencesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const amadeus_experiences_provider_1 = require("../providers/amadeus-experiences.provider");
let AmadeusExperiencesController = class AmadeusExperiencesController {
    constructor(provider) {
        this.provider = provider;
    }
    getActivities(latitude, longitude, radius) {
        return this.provider.getActivities({ latitude: +latitude, longitude: +longitude, radius: radius ? +radius : undefined });
    }
    getActivitiesBySquare(north, west, south, east) {
        return this.provider.getActivitiesBySquare({ north: +north, west: +west, south: +south, east: +east });
    }
    getActivityById(activityId) {
        return this.provider.getActivityById(activityId);
    }
    citySearch(countryCode, keyword, max, include) {
        return this.provider.citySearch({ countryCode, keyword, max: max ? +max : undefined, include });
    }
};
exports.AmadeusExperiencesController = AmadeusExperiencesController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('activities'),
    (0, swagger_1.ApiOperation)({ summary: 'Tours & Activities by location' }),
    (0, swagger_1.ApiQuery)({ name: 'latitude', type: Number, example: 41.397158 }),
    (0, swagger_1.ApiQuery)({ name: 'longitude', type: Number, example: 2.160873 }),
    (0, swagger_1.ApiQuery)({ name: 'radius', type: Number, required: false }),
    __param(0, (0, common_1.Query)('latitude')),
    __param(1, (0, common_1.Query)('longitude')),
    __param(2, (0, common_1.Query)('radius')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", void 0)
], AmadeusExperiencesController.prototype, "getActivities", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('activities/by-square'),
    (0, swagger_1.ApiOperation)({ summary: 'Tours & Activities within a geographic square' }),
    (0, swagger_1.ApiQuery)({ name: 'north', type: Number, example: 41.397158 }),
    (0, swagger_1.ApiQuery)({ name: 'west', type: Number, example: 2.160873 }),
    (0, swagger_1.ApiQuery)({ name: 'south', type: Number, example: 41.394582 }),
    (0, swagger_1.ApiQuery)({ name: 'east', type: Number, example: 2.177181 }),
    __param(0, (0, common_1.Query)('north')),
    __param(1, (0, common_1.Query)('west')),
    __param(2, (0, common_1.Query)('south')),
    __param(3, (0, common_1.Query)('east')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Number]),
    __metadata("design:returntype", void 0)
], AmadeusExperiencesController.prototype, "getActivitiesBySquare", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('activities/:activityId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific tour or activity by ID' }),
    __param(0, (0, common_1.Param)('activityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AmadeusExperiencesController.prototype, "getActivityById", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('cities'),
    (0, swagger_1.ApiOperation)({ summary: 'City search' }),
    (0, swagger_1.ApiQuery)({ name: 'countryCode', example: 'FR' }),
    (0, swagger_1.ApiQuery)({ name: 'keyword', example: 'PARIS' }),
    (0, swagger_1.ApiQuery)({ name: 'max', type: Number, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'include', required: false, example: 'AIRPORTS' }),
    __param(0, (0, common_1.Query)('countryCode')),
    __param(1, (0, common_1.Query)('keyword')),
    __param(2, (0, common_1.Query)('max')),
    __param(3, (0, common_1.Query)('include')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, String]),
    __metadata("design:returntype", void 0)
], AmadeusExperiencesController.prototype, "citySearch", null);
exports.AmadeusExperiencesController = AmadeusExperiencesController = __decorate([
    (0, swagger_1.ApiTags)('Amadeus — Destination Experiences'),
    (0, common_1.Controller)('amadeus/experiences'),
    __metadata("design:paramtypes", [amadeus_experiences_provider_1.AmadeusExperiencesProvider])
], AmadeusExperiencesController);
//# sourceMappingURL=amadeus-experiences.controller.js.map