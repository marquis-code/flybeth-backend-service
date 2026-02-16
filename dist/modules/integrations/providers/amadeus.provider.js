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
var AmadeusProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmadeusProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amadeus_base_provider_1 = require("./amadeus-base.provider");
let AmadeusProvider = AmadeusProvider_1 = class AmadeusProvider extends amadeus_base_provider_1.AmadeusBaseProvider {
    constructor(configService) {
        super(configService, AmadeusProvider_1.name);
        this.providerName = 'Amadeus';
    }
    async onModuleInit() {
        await this.warmUpToken();
    }
    async searchFlights(query) {
        if (!this.isConfigured)
            return [];
        try {
            const data = await this.amadeusGet('/v2/shopping/flight-offers', {
                originLocationCode: query.origin,
                destinationLocationCode: query.destination,
                departureDate: query.departureDate,
                returnDate: query.returnDate || undefined,
                adults: query.passengers || 1,
                max: 10,
            });
            return (data.data || []).map((offer) => this.mapOfferToResult(offer, data.dictionaries));
        }
        catch (err) {
            this.logger.error(`searchFlights error: ${err.message}`);
            return [];
        }
    }
    async bookFlight(_flightId, _passengers) {
        this.logger.warn('Use createFlightOrder() instead');
        return { pnr: 'UNSUPPORTED', ticketNumbers: [] };
    }
    async cancelBooking(_pnr) { return false; }
    async searchFlightOffers(params) {
        const q = {
            originLocationCode: params.originLocationCode,
            destinationLocationCode: params.destinationLocationCode,
            departureDate: params.departureDate,
            adults: params.adults,
        };
        if (params.returnDate)
            q.returnDate = params.returnDate;
        if (params.children)
            q.children = params.children;
        if (params.infants)
            q.infants = params.infants;
        if (params.travelClass)
            q.travelClass = params.travelClass;
        if (params.includedAirlineCodes)
            q.includedAirlineCodes = params.includedAirlineCodes;
        if (params.excludedAirlineCodes)
            q.excludedAirlineCodes = params.excludedAirlineCodes;
        if (params.nonStop !== undefined)
            q.nonStop = params.nonStop;
        if (params.currencyCode)
            q.currencyCode = params.currencyCode;
        if (params.maxPrice)
            q.maxPrice = params.maxPrice;
        if (params.max)
            q.max = params.max;
        return this.amadeusGet('/v2/shopping/flight-offers', q);
    }
    async searchFlightOffersPost(body) {
        return this.amadeusPost('/v2/shopping/flight-offers', body);
    }
    async priceFlightOffer(request) {
        return this.amadeusPost('/v1/shopping/flight-offers/pricing', request, {
            'X-HTTP-Method-Override': 'GET',
        });
    }
    async createFlightOrder(request) {
        return this.amadeusPost('/v1/booking/flight-orders', request);
    }
    async getFlightOrder(orderId) {
        return this.amadeusGet(`/v1/booking/flight-orders/${orderId}`);
    }
    async deleteFlightOrder(orderId) {
        return this.amadeusDelete(`/v1/booking/flight-orders/${orderId}`);
    }
    async getSeatmapByOrder(flightOrderId) {
        return this.amadeusGet('/v1/shopping/seatmaps', { 'flight-orderId': flightOrderId });
    }
    async getSeatmapByOffer(body) {
        return this.amadeusPost('/v1/shopping/seatmaps', body);
    }
    async brandedFaresUpsell(body) {
        return this.amadeusPost('/v1/shopping/flight-offers/upselling', body);
    }
    async flightPriceAnalysis(params) {
        return this.amadeusGet('/v1/analytics/itinerary-price-metrics', params);
    }
    async flightChoicePrediction(body) {
        return this.amadeusPost('/v2/shopping/flight-offers/prediction', body);
    }
    async flightInspirationSearch(params) {
        return this.amadeusGet('/v1/shopping/flight-destinations', params);
    }
    async flightCheapestDate(params) {
        return this.amadeusGet('/v1/shopping/flight-dates', params);
    }
    async flightAvailabilities(body) {
        return this.amadeusPost('/v1/shopping/availability/flight-availabilities', body);
    }
    async travelRecommendations(params) {
        return this.amadeusGet('/v1/reference-data/recommended-locations', params);
    }
    async onDemandFlightStatus(params) {
        return this.amadeusGet('/v2/schedule/flights', params);
    }
    async flightDelayPrediction(params) {
        return this.amadeusGet('/v1/travel/predictions/flight-delay', params);
    }
    async airportOnTimePerformance(params) {
        return this.amadeusGet('/v1/airport/predictions/on-time', params);
    }
    async airportCitySearch(params) {
        return this.amadeusGet('/v1/reference-data/locations', params);
    }
    async airportCityById(locationId) {
        return this.amadeusGet(`/v1/reference-data/locations/${locationId}`);
    }
    async nearestAirports(params) {
        return this.amadeusGet('/v1/reference-data/locations/airports', params);
    }
    async airportRoutes(params) {
        return this.amadeusGet('/v1/airport/direct-destinations', params);
    }
    async flightCheckinLinks(params) {
        return this.amadeusGet('/v2/reference-data/urls/checkin-links', params);
    }
    async airlineCodeLookup(params) {
        return this.amadeusGet('/v1/reference-data/airlines', params);
    }
    async airlineRoutes(params) {
        return this.amadeusGet('/v1/airline/destinations', params);
    }
    mapOfferToResult(offer, dictionaries) {
        const firstIt = offer.itineraries?.[0];
        const firstSeg = firstIt?.segments?.[0];
        const lastSeg = firstIt?.segments?.[firstIt.segments.length - 1];
        const cc = firstSeg?.carrierCode || '';
        return {
            provider: 'Amadeus',
            flightNumber: `${cc}${firstSeg?.number || ''}`,
            airline: dictionaries?.carriers?.[cc] || cc,
            origin: firstSeg?.departure?.iataCode || '',
            destination: lastSeg?.arrival?.iataCode || '',
            departureTime: firstSeg?.departure?.at || '',
            arrivalTime: lastSeg?.arrival?.at || '',
            duration: this.parseDuration(firstIt?.duration || 'PT0M'),
            price: parseFloat(offer.price?.total) || 0,
            currency: offer.price?.currency || 'EUR',
            seatsAvailable: offer.numberOfBookableSeats || 0,
        };
    }
};
exports.AmadeusProvider = AmadeusProvider;
exports.AmadeusProvider = AmadeusProvider = AmadeusProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AmadeusProvider);
//# sourceMappingURL=amadeus.provider.js.map