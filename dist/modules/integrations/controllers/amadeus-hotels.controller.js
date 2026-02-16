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
exports.AmadeusHotelsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const amadeus_hotels_provider_1 = require("../providers/amadeus-hotels.provider");
let AmadeusHotelsController = class AmadeusHotelsController {
    constructor(provider) {
        this.provider = provider;
    }
    hotelsByCity(cityCode, radius, radiusUnit, amenities, ratings, hotelSource) {
        return this.provider.hotelsByCity({
            cityCode,
            radius: radius ? +radius : undefined,
            radiusUnit,
            amenities,
            ratings,
            hotelSource,
        });
    }
    hotelsByGeocode(latitude, longitude, radius, radiusUnit) {
        return this.provider.hotelsByGeocode({
            latitude: +latitude,
            longitude: +longitude,
            radius: radius ? +radius : undefined,
            radiusUnit,
        });
    }
    hotelsByIds(hotelIds) {
        return this.provider.hotelsByIds({ hotelIds });
    }
    searchOffers(hotelIds, adults, checkInDate, checkOutDate, roomQuantity, priceRange, currency, bestRateOnly) {
        return this.provider.searchHotelOffers({
            hotelIds,
            adults: adults ? +adults : undefined,
            checkInDate,
            checkOutDate,
            roomQuantity: roomQuantity ? +roomQuantity : undefined,
            priceRange,
            currency,
            bestRateOnly,
        });
    }
    getOffer(offerId) {
        return this.provider.getHotelOffer(offerId);
    }
    bookV1(body) {
        return this.provider.createHotelBookingV1(body);
    }
    bookV2(body) {
        return this.provider.createHotelBookingV2(body);
    }
    ratings(hotelIds) {
        return this.provider.hotelRatings({ hotelIds });
    }
    autocomplete(keyword, subType, countryCode, lang, max) {
        return this.provider.hotelNameAutocomplete({
            keyword,
            subType,
            countryCode,
            lang,
            max: max ? +max : undefined,
        });
    }
};
exports.AmadeusHotelsController = AmadeusHotelsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('by-city'),
    (0, swagger_1.ApiOperation)({ summary: 'List hotels by city code' }),
    (0, swagger_1.ApiQuery)({ name: 'cityCode', example: 'DEL' }),
    (0, swagger_1.ApiQuery)({ name: 'radius', type: Number, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'radiusUnit', required: false, enum: ['KM', 'MILE'] }),
    (0, swagger_1.ApiQuery)({ name: 'amenities', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'ratings', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'hotelSource', required: false, enum: ['BEDBANK', 'DIRECTCHAIN', 'ALL'] }),
    __param(0, (0, common_1.Query)('cityCode')),
    __param(1, (0, common_1.Query)('radius')),
    __param(2, (0, common_1.Query)('radiusUnit')),
    __param(3, (0, common_1.Query)('amenities')),
    __param(4, (0, common_1.Query)('ratings')),
    __param(5, (0, common_1.Query)('hotelSource')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, String, String, String]),
    __metadata("design:returntype", void 0)
], AmadeusHotelsController.prototype, "hotelsByCity", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('by-geocode'),
    (0, swagger_1.ApiOperation)({ summary: 'List hotels by geographic coordinates' }),
    (0, swagger_1.ApiQuery)({ name: 'latitude', type: Number, example: 41.397158 }),
    (0, swagger_1.ApiQuery)({ name: 'longitude', type: Number, example: 2.160873 }),
    (0, swagger_1.ApiQuery)({ name: 'radius', type: Number, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'radiusUnit', required: false, enum: ['KM', 'MILE'] }),
    __param(0, (0, common_1.Query)('latitude')),
    __param(1, (0, common_1.Query)('longitude')),
    __param(2, (0, common_1.Query)('radius')),
    __param(3, (0, common_1.Query)('radiusUnit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, String]),
    __metadata("design:returntype", void 0)
], AmadeusHotelsController.prototype, "hotelsByGeocode", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('by-hotels'),
    (0, swagger_1.ApiOperation)({ summary: 'List hotels by hotel IDs' }),
    (0, swagger_1.ApiQuery)({ name: 'hotelIds', example: 'MCLONGHM' }),
    __param(0, (0, common_1.Query)('hotelIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AmadeusHotelsController.prototype, "hotelsByIds", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('offers'),
    (0, swagger_1.ApiOperation)({ summary: 'Search hotel offers' }),
    (0, swagger_1.ApiQuery)({ name: 'hotelIds', description: 'Comma-separated Amadeus hotel IDs' }),
    (0, swagger_1.ApiQuery)({ name: 'adults', type: Number, required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'checkInDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'checkOutDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'roomQuantity', type: Number, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'priceRange', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'currency', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'bestRateOnly', type: Boolean, required: false }),
    __param(0, (0, common_1.Query)('hotelIds')),
    __param(1, (0, common_1.Query)('adults')),
    __param(2, (0, common_1.Query)('checkInDate')),
    __param(3, (0, common_1.Query)('checkOutDate')),
    __param(4, (0, common_1.Query)('roomQuantity')),
    __param(5, (0, common_1.Query)('priceRange')),
    __param(6, (0, common_1.Query)('currency')),
    __param(7, (0, common_1.Query)('bestRateOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, String, Number, String, String, Boolean]),
    __metadata("design:returntype", void 0)
], AmadeusHotelsController.prototype, "searchOffers", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('offers/:offerId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get specific hotel offer details' }),
    __param(0, (0, common_1.Param)('offerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AmadeusHotelsController.prototype, "getOffer", null);
__decorate([
    (0, common_1.Post)('booking/v1'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create hotel booking (v1)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AmadeusHotelsController.prototype, "bookV1", null);
__decorate([
    (0, common_1.Post)('booking/v2'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create hotel booking (v2 — hotel orders)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AmadeusHotelsController.prototype, "bookV2", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('ratings'),
    (0, swagger_1.ApiOperation)({ summary: 'Hotel sentiments / ratings' }),
    (0, swagger_1.ApiQuery)({ name: 'hotelIds', example: 'ELONMFS,ADNYCCTB' }),
    __param(0, (0, common_1.Query)('hotelIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AmadeusHotelsController.prototype, "ratings", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('autocomplete'),
    (0, swagger_1.ApiOperation)({ summary: 'Hotel name autocomplete' }),
    (0, swagger_1.ApiQuery)({ name: 'keyword', example: 'PARI' }),
    (0, swagger_1.ApiQuery)({ name: 'subType', required: false, enum: ['HOTEL_LEISURE', 'HOTEL_GDS'] }),
    (0, swagger_1.ApiQuery)({ name: 'countryCode', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'lang', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'max', type: Number, required: false }),
    __param(0, (0, common_1.Query)('keyword')),
    __param(1, (0, common_1.Query)('subType')),
    __param(2, (0, common_1.Query)('countryCode')),
    __param(3, (0, common_1.Query)('lang')),
    __param(4, (0, common_1.Query)('max')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number]),
    __metadata("design:returntype", void 0)
], AmadeusHotelsController.prototype, "autocomplete", null);
exports.AmadeusHotelsController = AmadeusHotelsController = __decorate([
    (0, swagger_1.ApiTags)('Amadeus — Hotels'),
    (0, common_1.Controller)('amadeus/hotels'),
    __metadata("design:paramtypes", [amadeus_hotels_provider_1.AmadeusHotelsProvider])
], AmadeusHotelsController);
//# sourceMappingURL=amadeus-hotels.controller.js.map