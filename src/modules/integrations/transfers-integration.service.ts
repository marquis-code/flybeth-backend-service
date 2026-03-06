// src/modules/integrations/transfers-integration.service.ts
import { Injectable, Logger } from "@nestjs/common";
import {
  TransfersAdapter,
  TransferSearchQuery,
  TransferSearchResult,
} from "./interfaces/transfers-adapter.interface";
import { AmadeusTransfersProvider } from "./providers/amadeus-transfers.provider";
import { HotelbedsTransfersProvider } from "./providers/hotelbeds-transfers.provider";
import { ProviderConfigService } from "./provider-config.service";

@Injectable()
export class TransfersIntegrationService {
  private adapters: Map<string, TransfersAdapter> = new Map();
  private readonly logger = new Logger(TransfersIntegrationService.name);

  constructor(
    private amadeusTransfersProvider: AmadeusTransfersProvider,
    private hotelbedsTransfersProvider: HotelbedsTransfersProvider,
    private providerConfigService: ProviderConfigService,
  ) {
    this.registerAdapter(amadeusTransfersProvider);
    this.registerAdapter(hotelbedsTransfersProvider);
  }

  registerAdapter(adapter: TransfersAdapter) {
    this.adapters.set(adapter.providerName, adapter);
    this.logger.log(`Registered transfers adapter: ${adapter.providerName}`);
  }

  async search(query: TransferSearchQuery): Promise<{
    results: TransferSearchResult[];
    meta: {
      providersQueried: string[];
      totalResults: number;
      searchTime: number;
    };
  }> {
    const startTime = Date.now();
    const activeProviderNames = ["amadeus", "hotelbeds-transfers"];

    const promises = activeProviderNames
      .map((name) => this.adapters.get(name))
      .filter(Boolean)
      .map((adapter) =>
        adapter!
          .searchTransfers(query)
          .then((results) => results)
          .catch((err) => {
            this.logger.error(
              `Transfers adapter ${adapter!.providerName} failed: ${err.message}`,
            );
            return [] as TransferSearchResult[];
          }),
      );

    const allResults = await Promise.all(promises);
    const merged = allResults.flat();
    const searchTime = Date.now() - startTime;

    return {
      results: merged,
      meta: {
        providersQueried: activeProviderNames,
        totalResults: merged.length,
        searchTime,
      },
    };
  }

  async createOrder(offerId: string, provider: string, passengerDetails: any) {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new Error(`Unknown provider: ${provider}`);
    return adapter.createTransferOrder(offerId, passengerDetails);
  }
}
