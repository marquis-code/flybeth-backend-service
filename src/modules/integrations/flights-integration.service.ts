// src/modules/integrations/flights-integration.service.ts
import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
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
import { AirportsService } from "../airports/airports.service";
import { isNigerianOrigin } from "./constants/nigeria-origins.constant";

@Injectable()
export class FlightsIntegrationService {
  private adapters: Map<string, AirlineAdapter> = new Map();
  private readonly logger = new Logger(FlightsIntegrationService.name);

  constructor(
    private amadeusProvider: AmadeusProvider,
    private duffelProvider: DuffelProvider,
    private providerConfigService: ProviderConfigService,
    @Inject(forwardRef(() => AirportsService))
    private airportsService: AirportsService,
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
      providersSkipped: string[];
      providersWithNoResults: string[];
      providers: {
        name: string;
        status: "ok" | "empty" | "failed";
        results: number;
        durationMs: number;
        error?: string;
      }[];
      totalResults: number;
      searchTime: number;
    };
  }> {
    const startTime = Date.now();

    const cacheKey = `flights:live-search:${query.origin || ""}:${query.destination || ""}:${query.departureDate || ""}:${query.returnDate || ""}:${query.adults || 1}:${query.children || 0}:${query.infants || 0}:${query.class || "economy"}:${(query as any).userRole || "customer"}:${JSON.stringify(query.slices || [])}`;
    try {
      const cached = await this.cacheManager.get<any>(cacheKey);
      if (cached && cached.results && cached.results.length > 0) {
        this.logger.log(
          `Serving live flight search from cache for ${query.origin || query.slices?.[0]?.origin}→${query.destination || query.slices?.[0]?.destination} (${cached.results.length} offers)`,
        );
        return cached;
      }
    } catch (err) {
      this.logger.warn(`Flight search cache get error: ${err.message}`);
    }

    const config = await this.providerConfigService.getConfig();
    const activeProviderNames =
      await this.providerConfigService.getActiveProviderNames("flights");

    if (activeProviderNames.length === 0) {
      this.logger.warn("No active flight providers configured");
      return {
        results: [],
        meta: {
          providersQueried: [],
          providersSkipped: [],
          providersWithNoResults: [],
          providers: [],
          totalResults: 0,
          searchTime: 0,
        },
      };
    }

    // Amadeus is contracted for Nigerian-origin traffic only; everything else is Duffel.
    const { selected: providerNames, skipped: skippedProviderNames } =
      this.resolveProviderNames(query, activeProviderNames);
    this.logger.log(
      `Provider routing for ${query.origin || query.slices?.[0]?.origin}→${query.destination || query.slices?.[0]?.destination}: ` +
        `using [${providerNames.join(", ") || "none"}]` +
        (skippedProviderNames.length ? `, skipped [${skippedProviderNames.join(", ")}]` : ""),
    );

    // Generate combinations if flexible dates are enabled or comma-separated dates are passed
    const generateQueries = (baseQuery: FlightSearchQuery): FlightSearchQuery[] => {
      if (baseQuery.slices && baseQuery.slices.length > 0) return [baseQuery];
      if (String(baseQuery.flexibleDates) !== 'true' && !baseQuery.departureDate?.includes(',')) return [baseQuery];

      const queries: FlightSearchQuery[] = [];
      const addDays = (dateStr: string, days: number) => {
        const d = new Date(dateStr);
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
      };

      let depDates: (string | undefined)[] = [baseQuery.departureDate];
      if (baseQuery.departureDate?.includes(',')) {
        depDates = baseQuery.departureDate.split(',').map(d => d.trim());
      } else if (String(baseQuery.flexibleDates) === 'true' && baseQuery.departureDate) {
        depDates = [addDays(baseQuery.departureDate, -1), baseQuery.departureDate, addDays(baseQuery.departureDate, 1)];
      }

      let retDates: (string | undefined)[] = [baseQuery.returnDate];
      if (baseQuery.returnDate?.includes(',')) {
        retDates = baseQuery.returnDate.split(',').map(d => d.trim());
      } else if (String(baseQuery.flexibleDates) === 'true' && baseQuery.returnDate) {
        retDates = [addDays(baseQuery.returnDate, -1), baseQuery.returnDate, addDays(baseQuery.returnDate, 1)];
      }

      // Filter out undefined for logic
      const validRetDates = retDates.filter(Boolean) as string[];

      if (validRetDates.length > 0) {
        for (const d of depDates) {
          for (const r of validRetDates) {
            queries.push({ ...baseQuery, departureDate: d, returnDate: r });
          }
        }
      } else {
        for (const d of depDates) {
          queries.push({ ...baseQuery, departureDate: d });
        }
      }
      return queries;
    };

    const searchQueries = generateQueries(query);
    this.logger.log(`Generated ${searchQueries.length} query combinations for flexible dates`);

    // Search the routed providers concurrently, keeping per-provider telemetry so a
    // provider that has silently gone dark (expired credentials, retired API host,
    // empty content) is visible in the response instead of just shrinking the list.
    const promises = providerNames
      .map((name) => this.adapters.get(name))
      .filter(Boolean)
      .map(async (adapter) => {
        const providerName = adapter!.providerName;
        const results: FlightSearchResult[] = [];
        const errors: string[] = [];
        const providerStart = Date.now();

        // Run sequentially per provider to avoid rate limits
        for (const q of searchQueries) {
          try {
            const res = await adapter!.searchFlights(q);
            results.push(...res);
            // Small delay to prevent rate limit spikes
            if (searchQueries.length > 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (err) {
            const message = `${q.departureDate}: ${err.message}`;
            errors.push(message);
            this.logger.error(`Adapter ${providerName} failed on date ${message}`);
          }
        }

        const durationMs = Date.now() - providerStart;
        this.logger.log(
          `${providerName} returned ${results.length} results across ${searchQueries.length} date(s) in ${durationMs}ms`,
        );

        if (results.length === 0) {
          this.logger.warn(
            `${providerName} returned no offers for ${query.origin || query.slices?.[0]?.origin}→${query.destination || query.slices?.[0]?.destination}. ` +
              `If this provider should have content, check GET /flights/providers/health.`,
          );
        }

        return {
          name: providerName,
          status: (errors.length > 0 && results.length === 0
            ? "failed"
            : results.length > 0
              ? "ok"
              : "empty") as "ok" | "empty" | "failed",
          results,
          durationMs,
          error: errors.length > 0 ? errors.join("; ") : undefined,
        };
      });

    const providerRuns = await Promise.all(promises);
    const merged = providerRuns.flatMap((run) => run.results);

    // Apply commission to all results based on user segment and route context (domestic vs international)
    const withCommission = await Promise.all(merged.map(async (result) => ({
      ...result,
      priceWithCommission: await this.providerConfigService.applySegmentedCommission(
        result.price,
        (query as any).userRole || 'customer',
        {
          origin: (result as any).origin || query.origin,
          destination: (result as any).destination || query.destination,
        },
      ),
    })));

    // Sort by final price (with commission) — cheapest first with deterministic tie-breaking
    withCommission.sort((a, b) => {
      const diff = a.priceWithCommission - b.priceWithCommission;
      if (Math.abs(diff) > 0.01) return diff;
      const durDiff = (a.duration || 0) - (b.duration || 0);
      if (durDiff !== 0) return durDiff;
      const stopsDiff = (a.stops || 0) - (b.stops || 0);
      if (stopsDiff !== 0) return stopsDiff;
      const airlineDiff = (a.airline || "").localeCompare(b.airline || "");
      if (airlineDiff !== 0) return airlineDiff;
      return (a.departureTime || "").localeCompare(b.departureTime || "");
    });

    const searchTime = Date.now() - startTime;
    this.logger.log(
      `Aggregated ${withCommission.length} results from ${providerRuns.length} provider(s) in ${searchTime}ms`,
    );

    const searchResponse = {
      results: withCommission,
      meta: {
        providersQueried: providerNames,
        providersSkipped: skippedProviderNames,
        providersWithNoResults: providerRuns
          .filter((run) => run.status !== "ok")
          .map((run) => run.name),
        providers: providerRuns.map((run) => ({
          name: run.name,
          status: run.status,
          results: run.results.length,
          durationMs: run.durationMs,
          ...(run.error ? { error: run.error } : {}),
        })),
        totalResults: withCommission.length,
        searchTime,
      },
    };

    if (withCommission.length > 0) {
      try {
        // Cache search results for 5 minutes (300,000 ms) so reloads and multi-browser searches are consistent
        await this.cacheManager.set(cacheKey, searchResponse, 300000);
      } catch (err) {
        this.logger.warn(`Flight search cache set error: ${err.message}`);
      }
    }

    return searchResponse;
  }

  /**
   * Decide which providers should serve a search.
   *
   * Amadeus content is contracted for Nigerian-origin traffic only, so it is
   * called only when the itinerary starts in Nigeria; every other market is
   * served by Duffel. Amadeus also has no multi-city support (it returns no
   * offers for slices), so multi-city searches are Duffel-only by design.
   */
  private resolveProviderNames(
    query: FlightSearchQuery,
    activeProviderNames: string[],
  ): { selected: string[]; skipped: string[] } {
    const isMultiCity = Boolean(query.slices && query.slices.length > 0);
    const originCodes = isMultiCity
      ? (query.slices || []).map((slice) => slice.origin)
      : [query.origin];

    const startsInNigeria = originCodes.some((code) => isNigerianOrigin(code));
    const useAmadeus = startsInNigeria && !isMultiCity && !this.amadeusProvider.isRateLimited();

    const selected = activeProviderNames.filter((name) =>
      name === "amadeus" ? useAmadeus : true,
    );
    const skipped = activeProviderNames.filter(
      (name) => !selected.includes(name),
    );

    return { selected, skipped };
  }

  /**
   * Verify that every configured flight provider is actually reachable/authenticated.
   * Amadeus silently returning nothing (e.g. retired API host or expired key) otherwise
   * looks identical to "no flights on this route".
   */
  async checkProviders(): Promise<{
    providers: {
      name: string;
      enabled: boolean;
      scope: string;
      ok: boolean;
      durationMs: number;
      message?: string;
    }[];
  }> {
    const config = await this.providerConfigService.getConfig();
    const enabled = new Set(
      config.providers.filter((p) => p.enabled).map((p) => p.name),
    );
    const scopes: Record<string, string> = {
      amadeus: "Nigerian-origin flights only",
      duffel: "all origins",
    };

    const results = await Promise.all(
      this.adaptersArray().map(async (adapter) => {
        const startedAt = Date.now();
        const base = {
          name: adapter.providerName,
          enabled: enabled.has(adapter.providerName),
          scope: scopes[adapter.providerName] || "all origins",
        };
        if (!adapter.healthCheck) {
          return {
            ...base,
            ok: true,
            durationMs: 0,
            message: "no health check implemented",
          };
        }
        try {
          const health = await adapter.healthCheck();
          return {
            ...base,
            ok: health.ok,
            durationMs: Date.now() - startedAt,
            message: health.message,
          };
        } catch (err) {
          return {
            ...base,
            ok: false,
            durationMs: Date.now() - startedAt,
            message: err.message,
          };
        }
      }),
    );

    return {
      providers: results.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  private adaptersArray(): AirlineAdapter[] {
    return Array.from(this.adapters.values());
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
    const result = await adapter.getOfferDetails(offerId);
    if (result && provider === 'duffel') {
       await this.applyAncillaryMargins(result);
    }
    return result;
  }

  /**
   * Internal helper to apply platform margins to Duffel available services (Baggage, etc.)
   */
  private async applyAncillaryMargins(result: FlightSearchResult) {
    if (!result.rawOffer?.available_services) return;
    
    const sysConfig = await this.providerConfigService.getGlobalConfig();
    const margin = 1 + (sysConfig?.ancillaryMargin || 15) / 100;

    result.rawOffer.available_services.forEach((service: any) => {
        if (service.total_amount) {
            const originalPrice = parseFloat(service.total_amount);
            service.original_amount = service.total_amount;
            service.total_amount = (originalPrice * margin).toFixed(2);
            service.margin_applied = true;
        }
    });
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
    services?: any[],
  ) {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    return adapter.bookFlight(offerId, passengers, payment, offer, services);
  }

  /**
   * Price a flight offer through the correct provider
   */
  async priceOffer(offer: any, provider: string, userRole: string = 'customer') {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    if (!adapter.priceOffer) {
      this.logger.warn(`Provider ${provider} does not support pricing`);
      return { data: { flightOffers: [offer] } }; // Fallback
    }
    const result = await adapter.priceOffer(offer);

    // Apply commission margin to the priced offer
    if (result?.data?.flightOffers?.[0]) {
       const pricedOffer = result.data.flightOffers[0];
       let basePrice = 0;

       if (provider === 'duffel') {
           basePrice = parseFloat(pricedOffer.total_amount || '0');
       } else if (provider === 'amadeus') {
           basePrice = parseFloat(pricedOffer.price?.total || pricedOffer.price?.grandTotal || '0');
       } else {
           basePrice = pricedOffer.price || 0;
       }

       let offerOrigin: string | undefined;
       let offerDestination: string | undefined;
       if (provider === 'duffel') {
           const firstSlice = pricedOffer.slices?.[0];
           offerOrigin = firstSlice?.origin?.iata_code || firstSlice?.origin;
           offerDestination = firstSlice?.destination?.iata_code || firstSlice?.destination;
       } else if (provider === 'amadeus') {
           const firstItin = pricedOffer.itineraries?.[0];
           const firstSeg = firstItin?.segments?.[0];
           const lastSeg = firstItin?.segments?.[firstItin.segments.length - 1];
           offerOrigin = firstSeg?.departure?.iataCode;
           offerDestination = lastSeg?.arrival?.iataCode;
       }

       const newPrice = await this.providerConfigService.applySegmentedCommission(
           basePrice,
           userRole,
           { origin: offerOrigin, destination: offerDestination },
       );

       const agencyFee = Math.max(0, newPrice - basePrice);

       if (provider === 'duffel') {
           pricedOffer.total_amount = newPrice.toFixed(2);
           pricedOffer.agency_fee = agencyFee.toFixed(2);
           if (pricedOffer.base_amount) {
               pricedOffer.base_amount = (parseFloat(pricedOffer.base_amount)).toFixed(2);
           }
           if (pricedOffer.tax_amount) {
               pricedOffer.tax_amount = (parseFloat(pricedOffer.tax_amount)).toFixed(2);
           }
       } else if (provider === 'amadeus') {
           if (pricedOffer.price?.total) pricedOffer.price.total = newPrice.toFixed(2);
           if (pricedOffer.price?.grandTotal) pricedOffer.price.grandTotal = newPrice.toFixed(2);
           if (pricedOffer.price) pricedOffer.price.agency_fee = agencyFee.toFixed(2);
       }

       if (provider === 'duffel') {
           // Wrap in search result format for helper
           const tempResult = { rawOffer: pricedOffer } as any;
           await this.applyAncillaryMargins(tempResult);
       }
    }

    return result;
  }

  /**
   * Get seatmap through the correct provider and apply our margin
   */
  async getSeatmap(flightOffer: any, provider: string) {
    let activeProvider = provider;

    // Infer provider if missing – very useful for direct API calls or frontend misses
    if (!activeProvider && flightOffer) {
      if (flightOffer.slices) activeProvider = 'duffel';
      else if (flightOffer.itineraries) activeProvider = 'amadeus';
    }

    const adapter = this.adapters.get(activeProvider);
    if (!adapter) {
      throw new Error(`Unknown provider: ${activeProvider}`);
    }
    if (!adapter.getSeatmap) {
      throw new Error(`Provider ${activeProvider} does not support seatmaps`);
    }

    let seatmapResponse;
    try {
      seatmapResponse = await adapter.getSeatmap(flightOffer);
    } catch (error) {
      this.logger.warn(`Seatmap retrieval failed for ${activeProvider}: ${error.message}`);
      return { data: [] };
    }
    
    // Apply margin if it's Duffel (or other providers)
    // Seatmaps from Duffel have cabins -> rows -> sections -> elements
    // Elements of type 'seat' have a 'total_amount' if they are bookable services
    
    const sysConfig = await this.providerConfigService.getGlobalConfig();
    const margin = 1 + (sysConfig?.ancillaryMargin || 15) / 100;

    if (activeProvider === 'duffel' && seatmapResponse?.data) {
      seatmapResponse.data.forEach((map: any) => {
        map.cabins?.forEach((cabin: any) => {
          cabin.rows?.forEach((row: any) => {
            row.sections?.forEach((section: any) => {
              section.elements?.forEach((element: any) => {
                if (element.type === 'seat' && element.available_services) {
                  element.available_services.forEach((service: any) => {
                    if (service.total_amount) {
                      const originalPrice = parseFloat(service.total_amount);
                      service.original_amount = service.total_amount;
                      service.total_amount = (originalPrice * margin).toFixed(2);
                      service.margin_applied = true;
                    }
                  });
                }
              });
            });
          });
        });
      });
    }

    return seatmapResponse;
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

  async createCustomer(provider: string, userData: any) {
    const adapter = this.adapters.get(provider);
    if (!adapter?.createCustomer) return null;
    return adapter.createCustomer(userData);
  }

  async createClientKey(provider: string, customerId: string) {
    const adapter = this.adapters.get(provider);
    if (!adapter?.createClientKey) return null;
    return adapter.createClientKey(customerId);
  }

  async createHoldOrder(provider: string, offerId: string, passengers: any[]) {
    const adapter = this.adapters.get(provider);
    if (!adapter?.createHoldOrder) {
      throw new Error(`Provider ${provider} does not support hold orders`);
    }
    return adapter.createHoldOrder(offerId, passengers);
  }

  async payForOrder(provider: string, orderId: string, payment: any) {
    const adapter = this.adapters.get(provider);
    if (!adapter?.payForOrder) {
      throw new Error(`Provider ${provider} does not support paying for orders`);
    }
    return adapter.payForOrder(orderId, payment);
  }

  async createCard(provider: string, cardData: any) {
    const adapter = this.adapters.get(provider);
    if (!adapter?.createCard) {
      throw new Error(`Provider ${provider} does not support card creation`);
    }
    return adapter.createCard(cardData);
  }

  async deleteCard(provider: string, cardId: string) {
    const adapter = this.adapters.get(provider);
    if (!adapter?.deleteCard) {
      throw new Error(`Provider ${provider} does not support card deletion`);
    }
    return adapter.deleteCard(cardId);
  }

  async create3DSSession(provider: string, sessionData: any) {
    const adapter = this.adapters.get(provider);
    if (!adapter?.create3DSSession) {
      throw new Error(`Provider ${provider} does not support 3DS sessions`);
    }
    return adapter.create3DSSession(sessionData);
  }

  /**
   * Search for locations (cities/airports) across providers
   */
  async searchLocations(keyword: string, countryCode?: string): Promise<any[]> {
    const term = (keyword || "").trim();
    if (!term) return [];

    // LAYER 1 — Amadeus (kept first for accounts that still have access).
    try {
      const amadeus = this.adapters.get("amadeus");
      if (amadeus && (amadeus as any).searchLocations) {
        const results = await (amadeus as any).searchLocations(term, countryCode);
        if (Array.isArray(results) && results.length) {
          return results;
        }
      }
    } catch (err) {
      this.logger.warn(`Amadeus location search unavailable: ${err.message}`);
    }

    // LAYER 2 — Duffel place suggestions (authoritative airport + city search).
    const duffelResults = await this.searchLocationsViaDuffel(term, countryCode);
    if (duffelResults.length) return duffelResults;

    // LAYER 3 — our own airport reference data.
    return this.searchLocationsViaLocalDb(term);
  }

  /**
   * Normalises Duffel place suggestions into the Amadeus-ish shape the user app
   * already understands (iataCode / address.cityName / geoCode.latitude).
   */
  private async searchLocationsViaDuffel(
    keyword: string,
    countryCode?: string,
  ): Promise<any[]> {
    try {
      const response = await this.duffelProvider.getPlacesSuggestions({
        query: keyword,
      });
      const places = response?.data;
      if (!Array.isArray(places)) return [];

      const out: any[] = [];
      const seen = new Set<string>();

      for (const place of places) {
        const airports = Array.isArray(place.airports) ? place.airports : [];
        for (const airport of airports) {
          const code = airport.iata_code;
          if (!code || seen.has(code)) continue;
          if (
            countryCode &&
            airport.iata_country_code &&
            airport.iata_country_code.toUpperCase() !== countryCode.toUpperCase()
          ) {
            continue;
          }
          seen.add(code);
          out.push({
            iataCode: code,
            name: airport.name || place.name || "",
            detailedName: `${airport.name || ""} (${code})`,
            subType: "AIRPORT",
            address: {
              cityName: airport.city_name || place.city_name || "",
              countryCode: airport.iata_country_code || "",
            },
            geoCode: {
              latitude: airport.latitude,
              longitude: airport.longitude,
            },
            latitude: airport.latitude,
            longitude: airport.longitude,
            timeZone: airport.time_zone,
            provider: "duffel",
          });
        }

        // Make the city itself selectable ("all airports").
        const cityCode = place.iata_city_code;
        if (cityCode && !seen.has(cityCode)) {
          seen.add(cityCode);
          const firstAirport = airports[0];
          out.push({
            iataCode: cityCode,
            name: place.name || place.city_name || cityCode,
            detailedName: `${place.name || cityCode} (All Airports)`,
            subType: "CITY",
            address: {
              cityName: place.name || place.city_name || "",
              countryCode: place.iata_country_code || "",
            },
            geoCode: {
              latitude: firstAirport?.latitude,
              longitude: firstAirport?.longitude,
            },
            latitude: firstAirport?.latitude,
            longitude: firstAirport?.longitude,
            provider: "duffel",
          });
        }
      }

      return out;
    } catch (err) {
      this.logger.warn(`Duffel location search failed: ${err.message}`);
      return [];
    }
  }

  private async searchLocationsViaLocalDb(keyword: string): Promise<any[]> {
    try {
      const airports = (await this.airportsService.searchAirports(
        keyword,
        10,
      )) as any[];
      return (airports || []).map((a: any) => ({
        iataCode: a.code,
        name: a.name,
        detailedName: `${a.name} (${a.code})`,
        subType: "AIRPORT",
        address: {
          cityName: a.city || "",
          countryCode: a.countryCode || a.country || "",
        },
        geoCode: {
          latitude: a.latitude ?? a.location?.latitude,
          longitude: a.longitude ?? a.location?.longitude,
        },
        latitude: a.latitude ?? a.location?.latitude,
        longitude: a.longitude ?? a.location?.longitude,
        provider: "flybeth",
      }));
    } catch (err) {
      this.logger.warn(`Local airport search failed: ${err.message}`);
      return [];
    }
  }

  /**
   * Get nearest airports from providers
   */
  async getNearestAirports(
    latitude: number,
    longitude: number,
  ): Promise<any[]> {
    // Amadeus first (authoritative), then our own reference data. The Amadeus
    // self-service host is retired, so the local lookup is what actually serves
    // this in practice — it must never blow up the endpoint.
    try {
      const amadeus = this.adapters.get("amadeus");
      if (amadeus?.getNearestAirports) {
        const results = await amadeus.getNearestAirports(latitude, longitude);
        if (Array.isArray(results) && results.length) return results;
      }
    } catch (err) {
      this.logger.warn(`Amadeus nearest-airport lookup failed: ${err.message}`);
    }

    try {
      const local = await this.airportsService.findNearest(latitude, longitude, 5);
      return local.map((a: any) => ({
        iataCode: a.code,
        name: a.name,
        detailedName: `${a.name} (${a.code})`,
        subType: "AIRPORT",
        address: { cityName: a.city, countryCode: a.country },
        geoCode: { latitude: a.lat, longitude: a.lng },
        distanceKm: a.distanceKm,
        provider: "flybeth",
      }));
    } catch (err) {
      this.logger.warn(`Local nearest-airport lookup failed: ${err.message}`);
      return [];
    }
  }

  /**
   * Predict the trip purpose using Amadeus Itinerary Management API
   */
  async predictTripPurpose(
    origin: string,
    destination: string,
    departureDate: string,
    returnDate: string,
  ): Promise<any> {
    const amadeus = this.adapters.get("amadeus") as AmadeusProvider;
    if (amadeus && amadeus.predictTripPurpose) {
      return amadeus.predictTripPurpose(
        origin,
        destination,
        departureDate,
        returnDate,
      );
    }
    return null;
  }

  /**
   * Get flight inspiration/cheapest destinations from an origin
   */
  async getFlightInspiration(
    origin: string,
    departureDate?: string,
  ): Promise<any[]> {
    const amadeus = this.adapters.get("amadeus") as AmadeusProvider;
    if (amadeus && amadeus.getFlightInspiration) {
      return amadeus.getFlightInspiration(origin, departureDate);
    }
    return [];
  }

  /**
   * Cheapest live offer per destination, for the landing-page deal rails.
   *
   * Every deal is a real supplier search (roughly 5–10s per route), so results are
   * cached and the routes are searched with a small concurrency window. City names
   * come from our own airport reference data rather than being hard-coded.
   */
  /**
   * Curated baseline featured deals for popular routes so the landing page
   * loads instantly (<20ms) and never hangs, times out, or fails.
   */
  private getCuratedFeaturedDeals(
    originCode: string,
    isRoundTrip: boolean,
    safeLimit: number = 8,
  ) {
    const addDays = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().split("T")[0];
    };
    const departureDate = addDays(21);
    const returnDate = isRoundTrip ? addDays(28) : undefined;
    const now = new Date().toISOString();

    const defaults: Record<string, any[]> = {
      LOS: [
        { destination: "ABV", city: "Abuja", price: 115, currency: "USD", airline: "Air Peace", airlineLogo: "https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/P4.svg", provider: "amadeus" },
        { destination: "PHC", city: "Port Harcourt", price: 105, currency: "USD", airline: "Ibom Air", airlineLogo: "https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/QI.svg", provider: "amadeus" },
        { destination: "ACC", city: "Accra", price: 275, currency: "USD", airline: "Air Peace", airlineLogo: "https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/P4.svg", provider: "amadeus" },
        { destination: "LHR", city: "London", price: 890, currency: "USD", airline: "British Airways", airlineLogo: "https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/BA.svg", provider: "duffel" },
        { destination: "DXB", city: "Dubai", price: 740, currency: "USD", airline: "Emirates", airlineLogo: "https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/EK.svg", provider: "duffel" },
        { destination: "JFK", city: "New York", price: 1090, currency: "USD", airline: "Delta Air Lines", airlineLogo: "https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/DL.svg", provider: "duffel" },
        { destination: "KAN", city: "Kano", price: 125, currency: "USD", airline: "Max Air", airlineLogo: "https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/VM.svg", provider: "amadeus" },
        { destination: "NBO", city: "Nairobi", price: 590, currency: "USD", airline: "Kenya Airways", airlineLogo: "https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/KQ.svg", provider: "duffel" },
        { destination: "ENU", city: "Enugu", price: 110, currency: "USD", airline: "United Nigeria", airlineLogo: "https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/U5.svg", provider: "amadeus" },
        { destination: "JNB", city: "Johannesburg", price: 710, currency: "USD", airline: "South African Airways", airlineLogo: "https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/SA.svg", provider: "duffel" },
      ],
      ABV: [
        { destination: "LOS", city: "Lagos", price: 115, currency: "USD", airline: "Air Peace", airlineLogo: "https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/P4.svg", provider: "amadeus" },
        { destination: "LHR", city: "London", price: 920, currency: "USD", airline: "British Airways", airlineLogo: "https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/BA.svg", provider: "duffel" },
        { destination: "DXB", city: "Dubai", price: 760, currency: "USD", airline: "Emirates", airlineLogo: "https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/EK.svg", provider: "duffel" },
        { destination: "PHC", city: "Port Harcourt", price: 110, currency: "USD", airline: "Ibom Air", airlineLogo: "https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/QI.svg", provider: "amadeus" },
        { destination: "KAN", city: "Kano", price: 95, currency: "USD", airline: "Max Air", airlineLogo: "https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/VM.svg", provider: "amadeus" },
        { destination: "JFK", city: "New York", price: 1120, currency: "USD", airline: "Qatar Airways", airlineLogo: "https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/QR.svg", provider: "duffel" },
      ],
    };

    const candidateList = defaults[originCode] || defaults.LOS.filter((d) => d.destination !== originCode);
    return candidateList.slice(0, safeLimit).map((deal, idx) => ({
      origin: originCode,
      destination: deal.destination,
      city: deal.city,
      price: isRoundTrip ? Math.round(deal.price * 1.85) : deal.price,
      currency: deal.currency,
      airline: deal.airline,
      airlineLogo: deal.airlineLogo,
      departureDate,
      ...(returnDate ? { returnDate } : {}),
      provider: deal.provider,
      offerId: `featured_${originCode}_${deal.destination}_${idx}`,
      lastFoundAt: now,
    }));
  }

  /**
   * Refreshes featured deals with live GDS search asynchronously in the background.
   */
  private async refreshFeaturedDealsInBackground(
    originCode: string,
    isRoundTrip: boolean,
    safeLimit: number,
    cacheKey: string,
  ): Promise<void> {
    try {
      const candidates = [
        "ABV", "PHC", "ENU", "KAN",
        "LHR", "DXB", "JFK", "ACC", "NBO", "JNB",
      ]
        .filter((code) => code !== originCode)
        .slice(0, Math.max(safeLimit, 6));

      const addDays = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split("T")[0];
      };
      const departureDate = addDays(21);
      const returnDate = isRoundTrip ? addDays(28) : undefined;

      const deals: any[] = [];
      const concurrency = 4;

      for (let i = 0; i < candidates.length; i += concurrency) {
        const batch = candidates.slice(i, i + concurrency);
        const settled = await Promise.allSettled(
          batch.map(async (destination) => {
            // Give live supplier search at most 7s so background work doesn't run indefinitely
            const searchPromise = this.search({
              origin: originCode,
              destination,
              departureDate,
              ...(returnDate ? { returnDate } : {}),
              adults: 1,
              class: "ECONOMY",
            });
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 7000),
            );

            const searchResult: any = await Promise.race([searchPromise, timeoutPromise]);
            const cheapest = [...(searchResult?.results || [])].sort(
              (a, b) => a.priceWithCommission - b.priceWithCommission,
            )[0];
            if (!cheapest) return null;
            return {
              origin: originCode,
              destination,
              city: destination,
              price: cheapest.priceWithCommission,
              currency: cheapest.currency || "USD",
              airline: cheapest.airline,
              airlineLogo: cheapest.airlineLogo,
              departureDate,
              ...(returnDate ? { returnDate } : {}),
              provider: cheapest.provider,
              offerId: cheapest.offerId,
              lastFoundAt: new Date().toISOString(),
            };
          }),
        );
        for (const outcome of settled) {
          if (outcome.status === "fulfilled" && outcome.value) deals.push(outcome.value);
        }
      }

      if (deals.length) {
        await Promise.all(
          deals.map(async (deal) => {
            try {
              const airport: any = await this.airportsService.getAirportByCode(deal.destination);
              if (airport?.city) deal.city = airport.city;
            } catch {
              /* ignore */
            }
          }),
        );

        const result = deals.sort((a, b) => a.price - b.price).slice(0, safeLimit);
        await this.cacheManager.set(cacheKey, result, 3 * 60 * 60 * 1000);
        this.logger.log(`Background featured deals updated for ${originCode}: ${result.length} route(s)`);
      }
    } catch (err) {
      this.logger.warn(`Background featured deals refresh error: ${err.message}`);
    }
  }

  async getFeaturedDeals(
    origin: string = "LOS",
    tripType: string = "round-trip",
    limit: number = 8,
  ): Promise<
    {
      origin: string;
      destination: string;
      city: string;
      price: number;
      currency: string;
      airline: string;
      airlineLogo?: string;
      departureDate: string;
      returnDate?: string;
      provider: string;
      offerId: string;
      lastFoundAt: string;
    }[]
  > {
    const originCode = (origin || "LOS").toUpperCase();
    const isRoundTrip = !/^one-?way$/i.test(tripType || "");
    const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 12);
    const cacheKey = `flights:featured-deals:${originCode}:${isRoundTrip ? "rt" : "ow"}:${safeLimit}`;

    try {
      const cached = await this.cacheManager.get<any[]>(cacheKey);
      if (Array.isArray(cached) && cached.length) return cached;
    } catch (err) {
      this.logger.warn(`Featured deals cache get failed: ${err.message}`);
    }

    const curated = this.getCuratedFeaturedDeals(originCode, isRoundTrip, safeLimit);

    // Warm cache with curated deals so subsequent calls return in ~2ms
    try {
      await this.cacheManager.set(cacheKey, curated, 3 * 60 * 60 * 1000); // 3h
    } catch (err) {
      this.logger.warn(`Featured deals cache set failed: ${err.message}`);
    }

    // Refresh with real live search in background without blocking caller
    this.refreshFeaturedDealsInBackground(originCode, isRoundTrip, safeLimit, cacheKey);

    return curated;
  }

  /**
   * Get live deals for a specific origin
   * This fetches real-time offers for 6-8 popular destinations
   */
  async getLiveDeals(
    originCode: string,
    tripType: string = "round-trip",
  ): Promise<FlightSearchResult[]> {
    const cacheKey = `flights:live-deals:${originCode}:${tripType}`;
    try {
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

      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

      const dealPromises = destinations.slice(0, 6).map(async (dest, idx) => {
        // Stagger calls by 200ms to avoid rate limits
        await delay(idx * 200);
        return this.search({
          origin: originCode,
          destination: dest,
          departureDate,
          ...(tripType === "round-trip" ? { returnDate } : {}),
          adults: 1,
          class: "ECONOMY",
        })
          .then((res) => res.results[0] || null)
          .catch(() => null);
      });

      const settedResults = await Promise.allSettled(dealPromises);
      const results = settedResults
        .filter((r) => r.status === "fulfilled" && r.value !== null)
        .map((r: any) => r.value) as FlightSearchResult[];

      // Cache for 4 hours (longer TTL for homepage/discovery data)
      if (results.length > 0) {
        await this.cacheManager.set(cacheKey, results, 14400000);
      }

      return results;
    } catch (error) {
      this.logger.error(`Error in getLiveDeals: ${error.message}`);
      return [];
    }
  }
}
