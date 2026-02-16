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
var AmadeusHotelsProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmadeusHotelsProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amadeus_base_provider_1 = require("./amadeus-base.provider");
let AmadeusHotelsProvider = AmadeusHotelsProvider_1 = class AmadeusHotelsProvider extends amadeus_base_provider_1.AmadeusBaseProvider {
    constructor(configService) {
        super(configService, AmadeusHotelsProvider_1.name);
    }
    async onModuleInit() { await this.warmUpToken(); }
    async hotelsByCity(params) {
        return this.amadeusGet('/v1/reference-data/locations/hotels/by-city', params);
    }
    async hotelsByGeocode(params) {
        return this.amadeusGet('/v1/reference-data/locations/hotels/by-geocode', params);
    }
    async hotelsByIds(params) {
        return this.amadeusGet('/v1/reference-data/locations/hotels/by-hotels', params);
    }
    async searchHotelOffers(params) {
        return this.amadeusGet('/v3/shopping/hotel-offers', params);
    }
    async getHotelOffer(offerId) {
        return this.amadeusGet(`/v3/shopping/hotel-offers/${offerId}`);
    }
    async createHotelBookingV1(body) {
        return this.amadeusPost('/v1/booking/hotel-bookings', body);
    }
    async createHotelBookingV2(body) {
        return this.amadeusPost('/v2/booking/hotel-orders', body);
    }
    async hotelRatings(params) {
        return this.amadeusGet('/v2/e-reputation/hotel-sentiments', params);
    }
    async hotelNameAutocomplete(params) {
        return this.amadeusGet('/v1/reference-data/locations/hotel', params);
    }
};
exports.AmadeusHotelsProvider = AmadeusHotelsProvider;
exports.AmadeusHotelsProvider = AmadeusHotelsProvider = AmadeusHotelsProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AmadeusHotelsProvider);
//# sourceMappingURL=amadeus-hotels.provider.js.map