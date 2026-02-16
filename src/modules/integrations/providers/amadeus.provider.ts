// src/modules/integrations/providers/amadeus.provider.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmadeusBaseProvider } from './amadeus-base.provider';
import {
    AirlineAdapter,
    FlightSearchQuery,
    FlightSearchResult,
    AmadeusFlightSearchParams,
    AmadeusFlightOfferPriceRequest,
    AmadeusFlightOrderRequest,
} from '../interfaces/airline-adapter.interface';

@Injectable()
export class AmadeusProvider extends AmadeusBaseProvider implements AirlineAdapter, OnModuleInit {
    readonly providerName = 'Amadeus';

    constructor(configService: ConfigService) {
        super(configService, AmadeusProvider.name);
    }

    async onModuleInit() {
        await this.warmUpToken();
    }

    // ═══════════════════════ Generic Adapter (backward-compat) ═══════════════════════

    async searchFlights(query: FlightSearchQuery): Promise<FlightSearchResult[]> {
        if (!this.isConfigured) return [];
        try {
            const data = await this.amadeusGet('/v2/shopping/flight-offers', {
                originLocationCode: query.origin,
                destinationLocationCode: query.destination,
                departureDate: query.departureDate,
                returnDate: query.returnDate || undefined,
                adults: query.passengers || 1,
                max: 10,
            });
            return (data.data || []).map((offer: any) => this.mapOfferToResult(offer, data.dictionaries));
        } catch (err) {
            this.logger.error(`searchFlights error: ${err.message}`);
            return [];
        }
    }

    async bookFlight(_flightId: string, _passengers: any[]) {
        this.logger.warn('Use createFlightOrder() instead');
        return { pnr: 'UNSUPPORTED', ticketNumbers: [] as string[] };
    }

    async cancelBooking(_pnr: string) { return false; }

    // ═══════════════════════ Flight Booking ═══════════════════════

    /** GET /v2/shopping/flight-offers */
    async searchFlightOffers(params: AmadeusFlightSearchParams): Promise<any> {
        const q: Record<string, any> = {
            originLocationCode: params.originLocationCode,
            destinationLocationCode: params.destinationLocationCode,
            departureDate: params.departureDate,
            adults: params.adults,
        };
        if (params.returnDate) q.returnDate = params.returnDate;
        if (params.children) q.children = params.children;
        if (params.infants) q.infants = params.infants;
        if (params.travelClass) q.travelClass = params.travelClass;
        if (params.includedAirlineCodes) q.includedAirlineCodes = params.includedAirlineCodes;
        if (params.excludedAirlineCodes) q.excludedAirlineCodes = params.excludedAirlineCodes;
        if (params.nonStop !== undefined) q.nonStop = params.nonStop;
        if (params.currencyCode) q.currencyCode = params.currencyCode;
        if (params.maxPrice) q.maxPrice = params.maxPrice;
        if (params.max) q.max = params.max;

        return this.amadeusGet('/v2/shopping/flight-offers', q);
    }

    /** POST /v2/shopping/flight-offers */
    async searchFlightOffersPost(body: any): Promise<any> {
        return this.amadeusPost('/v2/shopping/flight-offers', body);
    }

    /** POST /v1/shopping/flight-offers/pricing */
    async priceFlightOffer(request: AmadeusFlightOfferPriceRequest): Promise<any> {
        return this.amadeusPost('/v1/shopping/flight-offers/pricing', request, {
            'X-HTTP-Method-Override': 'GET',
        });
    }

    /** POST /v1/booking/flight-orders */
    async createFlightOrder(request: AmadeusFlightOrderRequest): Promise<any> {
        return this.amadeusPost('/v1/booking/flight-orders', request);
    }

    /** GET /v1/booking/flight-orders/:id */
    async getFlightOrder(orderId: string): Promise<any> {
        return this.amadeusGet(`/v1/booking/flight-orders/${orderId}`);
    }

    /** DELETE /v1/booking/flight-orders/:id */
    async deleteFlightOrder(orderId: string): Promise<any> {
        return this.amadeusDelete(`/v1/booking/flight-orders/${orderId}`);
    }

    /** GET /v1/shopping/seatmaps?flight-orderId=... */
    async getSeatmapByOrder(flightOrderId: string): Promise<any> {
        return this.amadeusGet('/v1/shopping/seatmaps', { 'flight-orderId': flightOrderId });
    }

    /** POST /v1/shopping/seatmaps */
    async getSeatmapByOffer(body: any): Promise<any> {
        return this.amadeusPost('/v1/shopping/seatmaps', body);
    }

    /** POST /v1/shopping/flight-offers/upselling */
    async brandedFaresUpsell(body: any): Promise<any> {
        return this.amadeusPost('/v1/shopping/flight-offers/upselling', body);
    }

    /** GET /v1/analytics/itinerary-price-metrics */
    async flightPriceAnalysis(params: Record<string, any>): Promise<any> {
        return this.amadeusGet('/v1/analytics/itinerary-price-metrics', params);
    }

    /** POST /v2/shopping/flight-offers/prediction */
    async flightChoicePrediction(body: any): Promise<any> {
        return this.amadeusPost('/v2/shopping/flight-offers/prediction', body);
    }

    // ═══════════════════════ Flight Inspiration ═══════════════════════

    /** GET /v1/shopping/flight-destinations */
    async flightInspirationSearch(params: Record<string, any>): Promise<any> {
        return this.amadeusGet('/v1/shopping/flight-destinations', params);
    }

    /** GET /v1/shopping/flight-dates */
    async flightCheapestDate(params: Record<string, any>): Promise<any> {
        return this.amadeusGet('/v1/shopping/flight-dates', params);
    }

    /** POST /v1/shopping/availability/flight-availabilities */
    async flightAvailabilities(body: any): Promise<any> {
        return this.amadeusPost('/v1/shopping/availability/flight-availabilities', body);
    }

    /** GET /v1/reference-data/recommended-locations */
    async travelRecommendations(params: Record<string, any>): Promise<any> {
        return this.amadeusGet('/v1/reference-data/recommended-locations', params);
    }

    // ═══════════════════════ Flight Schedule ═══════════════════════

    /** GET /v2/schedule/flights */
    async onDemandFlightStatus(params: Record<string, any>): Promise<any> {
        return this.amadeusGet('/v2/schedule/flights', params);
    }

    /** GET /v1/travel/predictions/flight-delay */
    async flightDelayPrediction(params: Record<string, any>): Promise<any> {
        return this.amadeusGet('/v1/travel/predictions/flight-delay', params);
    }

    /** GET /v1/airport/predictions/on-time */
    async airportOnTimePerformance(params: Record<string, any>): Promise<any> {
        return this.amadeusGet('/v1/airport/predictions/on-time', params);
    }

    // ═══════════════════════ Airport ═══════════════════════

    /** GET /v1/reference-data/locations (airports & cities by keyword) */
    async airportCitySearch(params: Record<string, any>): Promise<any> {
        return this.amadeusGet('/v1/reference-data/locations', params);
    }

    /** GET /v1/reference-data/locations/:locationId */
    async airportCityById(locationId: string): Promise<any> {
        return this.amadeusGet(`/v1/reference-data/locations/${locationId}`);
    }

    /** GET /v1/reference-data/locations/airports (nearest) */
    async nearestAirports(params: Record<string, any>): Promise<any> {
        return this.amadeusGet('/v1/reference-data/locations/airports', params);
    }

    /** GET /v1/airport/direct-destinations */
    async airportRoutes(params: Record<string, any>): Promise<any> {
        return this.amadeusGet('/v1/airport/direct-destinations', params);
    }

    // ═══════════════════════ Airlines ═══════════════════════

    /** GET /v2/reference-data/urls/checkin-links */
    async flightCheckinLinks(params: Record<string, any>): Promise<any> {
        return this.amadeusGet('/v2/reference-data/urls/checkin-links', params);
    }

    /** GET /v1/reference-data/airlines */
    async airlineCodeLookup(params: Record<string, any>): Promise<any> {
        return this.amadeusGet('/v1/reference-data/airlines', params);
    }

    /** GET /v1/airline/destinations */
    async airlineRoutes(params: Record<string, any>): Promise<any> {
        return this.amadeusGet('/v1/airline/destinations', params);
    }

    // ═══════════════════════ Helpers ═══════════════════════

    private mapOfferToResult(offer: any, dictionaries: any): FlightSearchResult {
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
}
