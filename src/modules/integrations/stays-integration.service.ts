// src/modules/integrations/stays-integration.service.ts
import { Injectable, Logger } from "@nestjs/common";
import {
  StaysAdapter,
  StaysSearchQuery,
  StaysSearchResult,
  StaysRoomResult,
} from "./interfaces/stays-adapter.interface";
import { DuffelStaysProvider } from "./providers/duffel-stays.provider";
import { AmadeusHotelsProvider } from "./providers/amadeus-hotels.provider";
import { HotelbedsProvider } from "./providers/hotelbeds.provider";
import { ProviderConfigService } from "./provider-config.service";

@Injectable()
export class StaysIntegrationService {
  private adapters: Map<string, StaysAdapter> = new Map();
  private readonly logger = new Logger(StaysIntegrationService.name);

  constructor(
    private duffelStaysProvider: DuffelStaysProvider,
    private amadeusHotelsProvider: AmadeusHotelsProvider,
    private hotelbedsProvider: HotelbedsProvider,
    private providerConfigService: ProviderConfigService,
  ) {
    this.registerAdapter(duffelStaysProvider);
    this.registerAdapter(amadeusHotelsProvider);
    this.registerAdapter(hotelbedsProvider);
  }

  registerAdapter(adapter: StaysAdapter) {
    this.adapters.set(adapter.providerName, adapter);
    this.logger.log(`Registered stays adapter: ${adapter.providerName}`);
  }

  /**
   * Search all active stays providers concurrently, merge by cheapest price + commission
   */
  async search(query: StaysSearchQuery): Promise<{
    results: StaysSearchResult[];
    meta: {
      providersQueried: string[];
      totalResults: number;
      searchTime: number;
    };
  }> {
    const startTime = Date.now();
    const config = await this.providerConfigService.getConfig();
    const activeProviderNames =
      await this.providerConfigService.getActiveProviderNames("stays");

    if (activeProviderNames.length === 0) {
      this.logger.warn("No active stays providers configured");
      return {
        results: [],
        meta: {
          providersQueried: [],
          totalResults: 0,
          searchTime: 0,
        },
      };
    }

    const promises = activeProviderNames
      .map((name) => this.adapters.get(name))
      .filter(Boolean)
      .map((adapter) =>
        adapter!
          .searchStays(query)
          .then((results) => {
            this.logger.log(
              `${adapter!.providerName} stays returned ${results.length} results`,
            );
            return results;
          })
          .catch((err) => {
            this.logger.error(
              `Stays adapter ${adapter!.providerName} failed: ${err.message}`,
            );
            return [] as StaysSearchResult[];
          }),
      );

    const allResults = await Promise.all(promises);
    this.logger.log(
      `Active stays providers for this search: ${activeProviderNames.join(", ")}`,
    );

    // Provider weights for prioritization (Lower is better)
    const providerWeights: Record<string, number> = {
      hotelbeds: 1,
      amadeus: 2,
      duffel: 3,
    };

    // Flatten and apply commission first
    const flattened = allResults.flat().map((result) => ({
      ...result,
      priceWithCommission: this.providerConfigService.applyCommission(
        result.cheapestPrice,
        config,
      ),
      providerWeight: providerWeights[result.provider] || 99,
    }));

    // De-duplication Logic
    // We use a combination of normalized name and rounded coordinates to identify duplicates
    const seen = new Map<
      string,
      StaysSearchResult & {
        priceWithCommission: number;
        providerWeight: number;
      }
    >();

    for (const result of flattened) {
      const normalizedName = result.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      // Round to ~100m precision (3 decimal places) for coordinate matching
      const lat = result.location.latitude.toFixed(3);
      const lng = result.location.longitude.toFixed(3);
      const key = `${normalizedName}_${lat}_${lng}`;

      const existing = seen.get(key);
      if (!existing || result.providerWeight < existing.providerWeight) {
        // If better provider or first time seeing this property, keep it
        seen.set(key, result);
      }
    }

    const uniqueResults = Array.from(seen.values());

    // Sort by priority weight first, then price
    uniqueResults.sort((a, b) => {
      if (a.providerWeight !== b.providerWeight) {
        return a.providerWeight - b.providerWeight;
      }
      return a.priceWithCommission - b.priceWithCommission;
    });

    const searchTime = Date.now() - startTime;
    this.logger.log(
      `Aggregated ${uniqueResults.length} unique stays results from ${activeProviderNames.length} providers in ${searchTime}ms (De-duplicated from ${flattened.length})`,
    );

    return {
      results: uniqueResults,
      meta: {
        providersQueried: activeProviderNames,
        totalResults: uniqueResults.length,
        searchTime,
      },
    };
  }

  /**
   * Fetch rooms and rates for a search result
   */
  async fetchRates(
    searchResultId: string,
    provider: string,
    query?: StaysSearchQuery,
  ): Promise<StaysRoomResult[]> {
    const adapter = this.adapters.get(provider);
    if (!adapter?.fetchRates) {
      throw new Error(`Provider ${provider} does not support fetchRates`);
    }

    const config = await this.providerConfigService.getConfig();
    const rooms = await adapter.fetchRates(searchResultId, query);

    // Apply commission to all rates
    return rooms.map((room) => ({
      ...room,
      rates: room.rates.map((rate) => ({
        ...rate,
        priceWithCommission: this.providerConfigService.applyCommission(
          rate.price,
          config,
        ),
      })),
    }));
  }

  /**
   * Create a quote for a rate
   */
  async createQuote(rateId: string, provider: string) {
    const adapter = this.adapters.get(provider);
    if (!adapter?.createQuote) {
      throw new Error(`Provider ${provider} does not support createQuote`);
    }
    return adapter.createQuote(rateId);
  }

  /**
   * Create a stays booking from a quote
   */
  async createBooking(quoteId: string, guestDetails: any, provider: string) {
    const adapter = this.adapters.get(provider);
    if (!adapter?.createBooking) {
      throw new Error(`Provider ${provider} does not support createBooking`);
    }
    return adapter.createBooking(quoteId, guestDetails);
  }

  /**
   * Get property details from a specific provider
   */
  async getDetails(
    accommodationId: string,
    provider: string,
  ): Promise<Partial<StaysSearchResult>> {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Provider ${provider} not found`);
    }
    return adapter.getAccommodationDetails(accommodationId);
  }

  /**
   * Cancel a stays booking
   */
  async cancelBooking(bookingId: string, provider: string) {
    const adapter = this.adapters.get(provider);
    if (!adapter?.cancelBooking) {
      throw new Error(`Provider ${provider} does not support cancelBooking`);
    }
    return adapter.cancelBooking(bookingId);
  }
}
