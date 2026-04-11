// src/modules/integrations/cars-integration.service.ts
import { Injectable, Logger, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import {
  CarAdapter,
  CarSearchQuery,
  CarSearchResult,
  CarPriceCheckResult,
} from "./interfaces/car-adapter.interface";
import { ProviderConfigService } from "./provider-config.service";

@Injectable()
export class CarsIntegrationService {
  private adapters: Map<string, CarAdapter> = new Map();
  private readonly logger = new Logger(CarsIntegrationService.name);

  constructor(
    private providerConfigService: ProviderConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  registerAdapter(adapter: CarAdapter) {
    this.adapters.set(adapter.providerName, adapter);
    this.logger.log(`Registered car adapter: ${adapter.providerName}`);
  }

  /**
   * Search all active car providers concurrently
   */
  async search(query: CarSearchQuery): Promise<{
    results: CarSearchResult[];
    meta: {
      providersQueried: string[];
      totalResults: number;
      searchTime: number;
    };
  }> {
    const startTime = Date.now();
    const config = await this.providerConfigService.getConfig();

    // Sabre removed
    const activeProviderNames: string[] = [];

    const promises = activeProviderNames
      .map((name) => this.adapters.get(name))
      .filter(Boolean)
      .map((adapter) =>
        adapter!
          .searchCars(query)
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
            return [] as CarSearchResult[];
          }),
      );

    const allResults = await Promise.all(promises);
    const merged = allResults.flat();

    // Apply commission
    const withCommission = merged.map((result) => ({
      ...result,
      priceWithCommission: this.providerConfigService.applyCommission(
        result.price.totalAmount,
        config,
      ),
    }));

    // Sort by price
    withCommission.sort(
      (a, b) => a.priceWithCommission - b.priceWithCommission,
    );

    const searchTime = Date.now() - startTime;
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
   * Price check through the correct provider
   */
  async priceCheck(rateKey: string, provider: string) {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    return adapter.priceCheck(rateKey);
  }
}
