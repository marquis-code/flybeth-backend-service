// src/modules/integrations/experiences-integration.service.ts
import { Injectable, Logger } from "@nestjs/common";
import {
  ExperiencesAdapter,
  ExperienceSearchQuery,
  ExperienceSearchResult,
} from "./interfaces/experiences-adapter.interface";
import { AmadeusExperiencesProvider } from "./providers/amadeus-experiences.provider";
import { HotelbedsExperiencesProvider } from "./providers/hotelbeds-experiences.provider";

@Injectable()
export class ExperiencesIntegrationService {
  private adapters: Map<string, ExperiencesAdapter> = new Map();
  private readonly logger = new Logger(ExperiencesIntegrationService.name);

  constructor(
    private amadeusExperiencesProvider: AmadeusExperiencesProvider,
    private hotelbedsExperiencesProvider: HotelbedsExperiencesProvider,
  ) {
    this.registerAdapter(amadeusExperiencesProvider);
    this.registerAdapter(hotelbedsExperiencesProvider);
  }

  registerAdapter(adapter: ExperiencesAdapter) {
    this.adapters.set(adapter.providerName, adapter);
    this.logger.log(`Registered experiences adapter: ${adapter.providerName}`);
  }

  async search(query: ExperienceSearchQuery): Promise<{
    results: ExperienceSearchResult[];
    meta: {
      providersQueried: string[];
      totalResults: number;
      searchTime: number;
    };
  }> {
    const startTime = Date.now();
    const activeProviderNames = ["amadeus", "hotelbeds-activities"];

    const promises = activeProviderNames
      .map((name) => this.adapters.get(name))
      .filter(Boolean)
      .map((adapter) =>
        adapter!
          .searchExperiences(query)
          .then((results) => results)
          .catch((err) => {
            this.logger.error(
              `Experiences adapter ${adapter!.providerName} failed: ${err.message}`,
            );
            return [] as ExperienceSearchResult[];
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

  async getDetails(experienceId: string, provider: string) {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new Error(`Unknown provider: ${provider}`);
    return adapter.getExperienceDetails(experienceId);
  }

  async createBooking(bookingData: any, provider: string) {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new Error(`Unknown provider: ${provider}`);
    if (!adapter.bookExperience) {
      throw new Error(`Provider ${provider} does not support booking`);
    }
    return adapter.bookExperience(bookingData);
  }

  async cancelBooking(reference: string, provider: string) {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new Error(`Unknown provider: ${provider}`);
    if (!adapter.cancelBooking) {
      throw new Error(`Provider ${provider} does not support cancellation`);
    }
    return adapter.cancelBooking(reference);
  }
}
