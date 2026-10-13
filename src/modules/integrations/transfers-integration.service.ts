// src/modules/integrations/transfers-integration.service.ts
import { Injectable, Logger } from "@nestjs/common";
import {
  TransfersAdapter,
  TransferSearchQuery,
  TransferSearchResult,
} from "./interfaces/transfers-adapter.interface";
import { AmadeusTransfersProvider } from "./providers/amadeus-transfers.provider";
import { HotelbedsTransfersProvider } from "./providers/hotelbeds-transfers.provider";
import { WelcomePickupsProvider } from "./providers/welcome-pickups.provider";
import {
  LocalTransfersProvider,
  LOCAL_TRANSFERS_PROVIDER,
} from "./providers/local-transfers.provider";
import { ProviderConfigService } from "./provider-config.service";

@Injectable()
export class TransfersIntegrationService {
  private adapters: Map<string, TransfersAdapter> = new Map();
  private readonly logger = new Logger(TransfersIntegrationService.name);

  constructor(
    private amadeusTransfersProvider: AmadeusTransfersProvider,
    private hotelbedsTransfersProvider: HotelbedsTransfersProvider,
    private welcomePickupsProvider: WelcomePickupsProvider,
    private localTransfersProvider: LocalTransfersProvider,
    private providerConfigService: ProviderConfigService,
  ) {
    this.registerAdapter(amadeusTransfersProvider);
    this.registerAdapter(hotelbedsTransfersProvider);
    this.registerAdapter(welcomePickupsProvider);
    this.registerAdapter(localTransfersProvider);
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
    // Platform inventory runs alongside the external partners so the transfer
    // funnel is never empty when a partner is unconfigured.
    const activeProviderNames = [
      "amadeus",
      "hotelbeds-transfers",
      "welcome-pickups",
      LOCAL_TRANSFERS_PROVIDER,
    ];

    const promises = activeProviderNames
      .map((name) => this.adapters.get(name))
      .filter(Boolean)
      .map((adapter) =>
        adapter!
          .searchTransfers(query)
          .then((results) => {
            this.logger.log(
              `${adapter!.providerName} transfers returned ${results.length} results`,
            );
            return results;
          })
          .catch((err) => {
            this.logger.error(
              `Transfers adapter ${adapter!.providerName} failed: ${err.message}`,
            );
            return [] as TransferSearchResult[];
          }),
      );

    const allResults = await Promise.all(promises);
    const merged = allResults.flat();

    // Publish the customer-facing price alongside the net supplier price, using
    // the same commission the bookings module applies.
    const priced = await Promise.all(
      merged.map(async (item) => ({
        ...item,
        netPrice: item.price,
        priceWithCommission:
          await this.providerConfigService.applySegmentedCommission(
            item.price,
            'customer',
          ),
      })),
    );

    // Highest quality first: external partners, then our own inventory, then price.
    const weights: Record<string, number> = {
      amadeus: 1,
      "hotelbeds-transfers": 2,
      "welcome-pickups": 3,
      [LOCAL_TRANSFERS_PROVIDER]: 50,
    };
    priced.sort((a, b) => {
      const wa = weights[a.provider] ?? 99;
      const wb = weights[b.provider] ?? 99;
      if (wa !== wb) return wa - wb;
      return a.price - b.price;
    });

    const searchTime = Date.now() - startTime;

    return {
      results: priced,
      meta: {
        providersQueried: activeProviderNames,
        totalResults: priced.length,
        searchTime,
      },
    };
  }

  async createOrder(offerId: string, provider: string, passengerDetails: any) {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new Error(`Unknown provider: ${provider}`);
    return adapter.createTransferOrder(offerId, passengerDetails);
  }

  async cancelOrder(orderId: string, confirmNbr: string, provider: string) {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new Error(`Unknown provider: ${provider}`);

    if (adapter.cancelTransferOrder) {
      return adapter.cancelTransferOrder(orderId, confirmNbr);
    } else {
      throw new Error(`Cancellation not supported for provider: ${provider}`);
    }
  }
}
