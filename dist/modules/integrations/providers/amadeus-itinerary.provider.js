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
var AmadeusItineraryProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmadeusItineraryProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amadeus_base_provider_1 = require("./amadeus-base.provider");
let AmadeusItineraryProvider = AmadeusItineraryProvider_1 = class AmadeusItineraryProvider extends amadeus_base_provider_1.AmadeusBaseProvider {
    constructor(configService) {
        super(configService, AmadeusItineraryProvider_1.name);
    }
    async onModuleInit() { await this.warmUpToken(); }
    async tripPurposePrediction(params) {
        return this.amadeusGet('/v1/travel/predictions/trip-purpose', params);
    }
};
exports.AmadeusItineraryProvider = AmadeusItineraryProvider;
exports.AmadeusItineraryProvider = AmadeusItineraryProvider = AmadeusItineraryProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AmadeusItineraryProvider);
//# sourceMappingURL=amadeus-itinerary.provider.js.map