// src/modules/integrations/flights-integration.service.ts
import { Injectable, Logger } from '@nestjs/common';
import {
    AirlineAdapter,
    FlightSearchQuery,
    FlightSearchResult,
    AmadeusFlightSearchParams,
    AmadeusFlightOfferPriceRequest,
    AmadeusFlightOrderRequest,
} from './interfaces/airline-adapter.interface';
import { AmadeusProvider } from './providers/amadeus.provider';

@Injectable()
export class FlightsIntegrationService {
    private adapters: AirlineAdapter[] = [];
    private readonly logger = new Logger(FlightsIntegrationService.name);

    constructor(private amadeusProvider: AmadeusProvider) {
        this.registerAdapter(amadeusProvider);
    }

    registerAdapter(adapter: AirlineAdapter) {
        this.adapters.push(adapter);
        this.logger.log(`Registered airline adapter: ${adapter.providerName}`);
    }

    /** Search all registered adapters (sorted cheapest first). */
    async searchAllProviders(query: FlightSearchQuery): Promise<FlightSearchResult[]> {
        const promises = this.adapters.map(adapter =>
            adapter.searchFlights(query).catch(err => {
                this.logger.error(`Adapter ${adapter.providerName} failed: ${err.message}`);
                return [];
            }),
        );
        const results = await Promise.all(promises);
        return results.flat().sort((a, b) => a.price - b.price);
    }

    // ═══════════════ Flight Booking ═══════════════

    async searchAmadeusOffers(params: AmadeusFlightSearchParams) {
        return this.amadeusProvider.searchFlightOffers(params);
    }

    async searchAmadeusOffersPost(body: any) {
        return this.amadeusProvider.searchFlightOffersPost(body);
    }

    async priceAmadeusOffer(request: AmadeusFlightOfferPriceRequest) {
        return this.amadeusProvider.priceFlightOffer(request);
    }

    async createAmadeusOrder(request: AmadeusFlightOrderRequest) {
        return this.amadeusProvider.createFlightOrder(request);
    }

    async getAmadeusOrder(orderId: string) {
        return this.amadeusProvider.getFlightOrder(orderId);
    }

    async deleteAmadeusOrder(orderId: string) {
        return this.amadeusProvider.deleteFlightOrder(orderId);
    }

    async getSeatmapByOrder(flightOrderId: string) {
        return this.amadeusProvider.getSeatmapByOrder(flightOrderId);
    }

    async getSeatmapByOffer(body: any) {
        return this.amadeusProvider.getSeatmapByOffer(body);
    }

    async brandedFaresUpsell(body: any) {
        return this.amadeusProvider.brandedFaresUpsell(body);
    }

    async flightPriceAnalysis(params: Record<string, any>) {
        return this.amadeusProvider.flightPriceAnalysis(params);
    }

    async flightChoicePrediction(body: any) {
        return this.amadeusProvider.flightChoicePrediction(body);
    }

    // ═══════════════ Flight Inspiration ═══════════════

    async flightInspirationSearch(params: Record<string, any>) {
        return this.amadeusProvider.flightInspirationSearch(params);
    }

    async flightCheapestDate(params: Record<string, any>) {
        return this.amadeusProvider.flightCheapestDate(params);
    }

    async flightAvailabilities(body: any) {
        return this.amadeusProvider.flightAvailabilities(body);
    }

    async travelRecommendations(params: Record<string, any>) {
        return this.amadeusProvider.travelRecommendations(params);
    }

    // ═══════════════ Flight Schedule ═══════════════

    async onDemandFlightStatus(params: Record<string, any>) {
        return this.amadeusProvider.onDemandFlightStatus(params);
    }

    async flightDelayPrediction(params: Record<string, any>) {
        return this.amadeusProvider.flightDelayPrediction(params);
    }

    async airportOnTimePerformance(params: Record<string, any>) {
        return this.amadeusProvider.airportOnTimePerformance(params);
    }

    // ═══════════════ Airport / Airlines ═══════════════

    async airportCitySearch(params: Record<string, any>) {
        return this.amadeusProvider.airportCitySearch(params);
    }

    async airportCityById(locationId: string) {
        return this.amadeusProvider.airportCityById(locationId);
    }

    async nearestAirports(params: Record<string, any>) {
        return this.amadeusProvider.nearestAirports(params);
    }

    async airportRoutes(params: Record<string, any>) {
        return this.amadeusProvider.airportRoutes(params);
    }

    async flightCheckinLinks(params: Record<string, any>) {
        return this.amadeusProvider.flightCheckinLinks(params);
    }

    async airlineCodeLookup(params: Record<string, any>) {
        return this.amadeusProvider.airlineCodeLookup(params);
    }

    async airlineRoutes(params: Record<string, any>) {
        return this.amadeusProvider.airlineRoutes(params);
    }
}
