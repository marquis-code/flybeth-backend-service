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
var FlightsIntegrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlightsIntegrationService = void 0;
const common_1 = require("@nestjs/common");
const amadeus_provider_1 = require("./providers/amadeus.provider");
let FlightsIntegrationService = FlightsIntegrationService_1 = class FlightsIntegrationService {
    constructor(amadeusProvider) {
        this.amadeusProvider = amadeusProvider;
        this.adapters = [];
        this.logger = new common_1.Logger(FlightsIntegrationService_1.name);
        this.registerAdapter(amadeusProvider);
    }
    registerAdapter(adapter) {
        this.adapters.push(adapter);
        this.logger.log(`Registered airline adapter: ${adapter.providerName}`);
    }
    async searchAllProviders(query) {
        const promises = this.adapters.map(adapter => adapter.searchFlights(query).catch(err => {
            this.logger.error(`Adapter ${adapter.providerName} failed: ${err.message}`);
            return [];
        }));
        const results = await Promise.all(promises);
        return results.flat().sort((a, b) => a.price - b.price);
    }
    async searchAmadeusOffers(params) {
        return this.amadeusProvider.searchFlightOffers(params);
    }
    async searchAmadeusOffersPost(body) {
        return this.amadeusProvider.searchFlightOffersPost(body);
    }
    async priceAmadeusOffer(request) {
        return this.amadeusProvider.priceFlightOffer(request);
    }
    async createAmadeusOrder(request) {
        return this.amadeusProvider.createFlightOrder(request);
    }
    async getAmadeusOrder(orderId) {
        return this.amadeusProvider.getFlightOrder(orderId);
    }
    async deleteAmadeusOrder(orderId) {
        return this.amadeusProvider.deleteFlightOrder(orderId);
    }
    async getSeatmapByOrder(flightOrderId) {
        return this.amadeusProvider.getSeatmapByOrder(flightOrderId);
    }
    async getSeatmapByOffer(body) {
        return this.amadeusProvider.getSeatmapByOffer(body);
    }
    async brandedFaresUpsell(body) {
        return this.amadeusProvider.brandedFaresUpsell(body);
    }
    async flightPriceAnalysis(params) {
        return this.amadeusProvider.flightPriceAnalysis(params);
    }
    async flightChoicePrediction(body) {
        return this.amadeusProvider.flightChoicePrediction(body);
    }
    async flightInspirationSearch(params) {
        return this.amadeusProvider.flightInspirationSearch(params);
    }
    async flightCheapestDate(params) {
        return this.amadeusProvider.flightCheapestDate(params);
    }
    async flightAvailabilities(body) {
        return this.amadeusProvider.flightAvailabilities(body);
    }
    async travelRecommendations(params) {
        return this.amadeusProvider.travelRecommendations(params);
    }
    async onDemandFlightStatus(params) {
        return this.amadeusProvider.onDemandFlightStatus(params);
    }
    async flightDelayPrediction(params) {
        return this.amadeusProvider.flightDelayPrediction(params);
    }
    async airportOnTimePerformance(params) {
        return this.amadeusProvider.airportOnTimePerformance(params);
    }
    async airportCitySearch(params) {
        return this.amadeusProvider.airportCitySearch(params);
    }
    async airportCityById(locationId) {
        return this.amadeusProvider.airportCityById(locationId);
    }
    async nearestAirports(params) {
        return this.amadeusProvider.nearestAirports(params);
    }
    async airportRoutes(params) {
        return this.amadeusProvider.airportRoutes(params);
    }
    async flightCheckinLinks(params) {
        return this.amadeusProvider.flightCheckinLinks(params);
    }
    async airlineCodeLookup(params) {
        return this.amadeusProvider.airlineCodeLookup(params);
    }
    async airlineRoutes(params) {
        return this.amadeusProvider.airlineRoutes(params);
    }
};
exports.FlightsIntegrationService = FlightsIntegrationService;
exports.FlightsIntegrationService = FlightsIntegrationService = FlightsIntegrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [amadeus_provider_1.AmadeusProvider])
], FlightsIntegrationService);
//# sourceMappingURL=flights-integration.service.js.map