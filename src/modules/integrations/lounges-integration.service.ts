import { Injectable, Logger, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import {
  LoungeAdapter,
  LoungeSearchQuery,
  LoungeSearchResult,
} from "./interfaces/lounge-adapter.interface";
import { ProviderConfigService } from "./provider-config.service";
import { PlumLoungesProvider } from "./providers/plum-lounges.provider";

@Injectable()
export class LoungesIntegrationService {
  private adapters: Map<string, LoungeAdapter> = new Map();
  private readonly logger = new Logger(LoungesIntegrationService.name);

  constructor(
    private providerConfigService: ProviderConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private plumLoungesProvider: PlumLoungesProvider,
  ) {
    this.registerAdapter(plumLoungesProvider);
  }

  registerAdapter(adapter: LoungeAdapter) {
    this.adapters.set(adapter.providerName, adapter);
    this.logger.log(`Registered lounge adapter: ${adapter.providerName}`);
  }

  /**
   * Search all active lounge providers concurrently
   */
  async search(query: LoungeSearchQuery): Promise<{
    results: LoungeSearchResult[];
    meta: {
      providersQueried: string[];
      totalResults: number;
      searchTime: number;
    };
  }> {
    const startTime = Date.now();
    const config = await this.providerConfigService.getConfig();

    const activeProviderNames: string[] = ["plum-lounges"];

    const promises = activeProviderNames
      .map((name) => this.adapters.get(name))
      .filter(Boolean)
      .map(async (adapter) => {
        try {
          return await adapter!.searchLounges(query);
        } catch (error) {
          this.logger.error(`Error searching ${adapter!.providerName}:`, error);
          return null;
        }
      });

    const settledResults = await Promise.allSettled(promises);
    const validResults: LoungeSearchResult[] = [];
    let totalItems = 0;

    for (const result of settledResults) {
      if (result.status === "fulfilled" && result.value) {
        validResults.push(result.value);
        totalItems += result.value.vouchers.length;
      }
    }

    const searchTime = Date.now() - startTime;
    this.logger.debug(`Lounge search completed in ${searchTime}ms. Found ${totalItems} items.`);

    return {
      results: validResults,
      meta: {
        providersQueried: activeProviderNames,
        totalResults: totalItems,
        searchTime,
      },
    };
  }
}
