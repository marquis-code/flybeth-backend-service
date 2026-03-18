// src/modules/integrations/flights-integration.service.ts
import { Injectable, Logger, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import {
  AirlineAdapter,
  FlightSearchQuery,
  FlightSearchResult,
} from "./interfaces/airline-adapter.interface";
import { AmadeusProvider } from "./providers/amadeus.provider";
import { DuffelProvider } from "./providers/duffel.provider";
import { ProviderConfigService } from "./provider-config.service";

@Injectable()
export class FlightsIntegrationService {
  private adapters: Map<string, AirlineAdapter> = new Map();
  private readonly logger = new Logger(FlightsIntegrationService.name);

  constructor(
    private amadeusProvider: AmadeusProvider,
    private duffelProvider: DuffelProvider,
    private providerConfigService: ProviderConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.registerAdapter(amadeusProvider);
    this.registerAdapter(duffelProvider);
  }

  registerAdapter(adapter: AirlineAdapter) {
    this.adapters.set(adapter.providerName, adapter);
    this.logger.log(`Registered airline adapter: ${adapter.providerName}`);
  }

  /**
   * Search all active providers concurrently, merge results sorted by price + commission
   */
  async search(query: FlightSearchQuery): Promise<{
    results: FlightSearchResult[];
    meta: {
      providersQueried: string[];
      totalResults: number;
      searchTime: number;
    };
  }> {
    const startTime = Date.now();
    const config = await this.providerConfigService.getConfig();
    const activeProviderNames =
      await this.providerConfigService.getActiveProviderNames("flights");

    if (activeProviderNames.length === 0) {
      this.logger.warn("No active flight providers configured");
      return {
        results: [],
        meta: {
          providersQueried: [],
          totalResults: 0,
          searchTime: 0,
        },
      };
    }

    // Search all active providers concurrently
    const promises = activeProviderNames
      .map((name) => this.adapters.get(name))
      .filter(Boolean)
      .map((adapter) =>
        adapter!
          .searchFlights(query)
          .then((results) => {
            this.logger.log(
              `${adapter!.providerName} returned ${results.length} results`,
            );
            return results;
          })
          .catch((err) => {
            this.logger.error(
              `Adapter ${adapter!.providerName} failed: ${err.message}`,
            );
            return [] as FlightSearchResult[];
          }),
      );

    const allResults = await Promise.all(promises);
    const merged = allResults.flat();

    // Apply commission to all results
    const withCommission = merged.map((result) => ({
      ...result,
      priceWithCommission: this.providerConfigService.applyCommission(
        result.price,
        config,
      ),
    }));

    // Sort by final price (with commission) — cheapest first
    withCommission.sort(
      (a, b) => a.priceWithCommission - b.priceWithCommission,
    );

    const searchTime = Date.now() - startTime;
    this.logger.log(
      `Aggregated ${withCommission.length} results from ${activeProviderNames.length} providers in ${searchTime}ms`,
    );

    return {
      results: withCommission,
      meta: {
        providersQueried: activeProviderNames,
        totalResults: withCommission.length,
        searchTime,
      },
    };
  }

  /**
   * Get offer details from the correct provider
   */
  async getOfferDetails(
    offerId: string,
    provider: string,
  ): Promise<FlightSearchResult | null> {
    const adapter = this.adapters.get(provider);
    if (!adapter?.getOfferDetails) {
      this.logger.warn(`No getOfferDetails for provider: ${provider}`);
      return null;
    }
    return adapter.getOfferDetails(offerId);
  }

  /**
   * Book a flight through the correct provider
   */
  async bookFlight(
    offerId: string,
    provider: string,
    passengers: any[],
    payment?: any,
    offer?: any,
  ) {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    return adapter.bookFlight(offerId, passengers, payment, offer);
  }

  /**
   * Price a flight offer through the correct provider
   */
  async priceOffer(offer: any, provider: string) {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    if (!adapter.priceOffer) {
      this.logger.warn(`Provider ${provider} does not support pricing`);
      return { data: { flightOffers: [offer] } }; // Fallback
    }
    return adapter.priceOffer(offer);
  }

  /**
   * Get seatmap through the correct provider
   */
  async getSeatmap(flightOffer: any, provider: string) {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    if (!adapter.getSeatmap) {
      throw new Error(`Provider ${provider} does not support seatmaps`);
    }
    return adapter.getSeatmap(flightOffer);
  }

  /**
   * Cancel a booking through the correct provider
   */
  async cancelBooking(orderId: string, provider: string) {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    return adapter.cancelBooking(orderId);
  }

  /**
   * Search for locations (cities/airports) across providers
   */
  async searchLocations(keyword: string, countryCode?: string): Promise<any[]> {
    // For locations, we primarily use Amadeus as it's the most robust
    const amadeus = this.adapters.get("amadeus");
    if (amadeus && amadeus.searchLocations) {
      return amadeus.searchLocations(keyword, countryCode);
    }
    return [];
  }

  /**
   * Get nearest airports from providers
   */
  async getNearestAirports(
    latitude: number,
    longitude: number,
  ): Promise<any[]> {
    const amadeus = this.adapters.get("amadeus");
    if (amadeus && amadeus.getNearestAirports) {
      return amadeus.getNearestAirports(latitude, longitude);
    }
    return [];
  }

  /**
   * Predict the trip purpose using Amadeus Itinerary Management API
   */
  async predictTripPurpose(origin: string, destination: string, departureDate: string, returnDate: string): Promise<any> {
    const amadeus = this.adapters.get("amadeus") as AmadeusProvider;
    if (amadeus && amadeus.predictTripPurpose) {
      return amadeus.predictTripPurpose(origin, destination, departureDate, returnDate);
    }
    return null;
  }

  /**
   * Get live deals for a specific origin
   * This fetches real-time offers for 6-8 popular destinations
   */
  async getLiveDeals(originCode: string): Promise<FlightSearchResult[]> {
    const cacheKey = `flights:live-deals:${originCode}`;
    const cached = await this.cacheManager.get<FlightSearchResult[]>(cacheKey);
    if (cached) return cached;

    // Popular destinations from Nigeria (or generally if origin is different)
    const destinations = [
      "LHR",
      "DXB",
      "NYC",
      "YUL",
      "ACC",
      "NBO",
      "FRA",
      "AMS",
    ].filter((d) => d !== originCode);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];
    const addDays = (date: Date, days: number) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    const departureDate = formatDate(addDays(new Date(), 30));
    const returnDate = formatDate(addDays(new Date(), 37));

    this.logger.log(`Fetching live deals for origin ${originCode}`);

    const dealPromises = destinations.slice(0, 6).map((dest) =>
      this.search({
        origin: originCode,
        destination: dest,
        departureDate,
        returnDate,
        adults: 1,
        class: "ECONOMY",
      })
        .then((res) => {
          // Return the cheapest result for this destination
          return res.results[0] || null;
        })
        .catch(() => null),
    );

    const results = (await Promise.all(dealPromises)).filter(
      Boolean,
    ) as FlightSearchResult[];

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, results, 3600000);

    return results;
  }
}
