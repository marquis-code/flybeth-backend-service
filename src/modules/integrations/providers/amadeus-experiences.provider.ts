// src/modules/integrations/providers/amadeus-experiences.provider.ts
import { Injectable, Logger } from "@nestjs/common";
import {
  ExperiencesAdapter,
  ExperienceSearchQuery,
  ExperienceSearchResult,
} from "../interfaces/experiences-adapter.interface";
import { AmadeusHelperService } from "./amadeus-helper.service";

@Injectable()
export class AmadeusExperiencesProvider implements ExperiencesAdapter {
  readonly providerName = "amadeus";
  private readonly logger = new Logger(AmadeusExperiencesProvider.name);

  constructor(private amadeusHelper: AmadeusHelperService) {}

  async searchExperiences(
    query: ExperienceSearchQuery,
  ): Promise<ExperienceSearchResult[]> {
    this.logger.log(
      `Searching Amadeus Experiences at: ${query.latitude},${query.longitude}`,
    );

    try {
      const token = await this.amadeusHelper.getAccessToken();
      const params = new URLSearchParams({
        latitude: String(query.latitude),
        longitude: String(query.longitude),
        radius: String(query.radius || 10),
      });

      const response = await fetch(
        `${this.amadeusHelper.baseUrl}/v1/shopping/activities?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(30000),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(
          `Amadeus experiences search failed: ${response.status} ${errText}`,
        );
        return [];
      }

      const data = await response.json();
      return this.mapSearchResults(data);
    } catch (error) {
      this.logger.error(`Amadeus experiences search error: ${error.message}`);
      return [];
    }
  }

  async getExperienceDetails(
    experienceId: string,
  ): Promise<ExperienceSearchResult | null> {
    this.logger.log(`Getting Amadeus experience details: ${experienceId}`);

    try {
      const token = await this.amadeusHelper.getAccessToken();
      const response = await fetch(
        `${this.amadeusHelper.baseUrl}/v1/shopping/activities/${experienceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        this.logger.error(
          `Amadeus experience details failed: ${response.status}`,
        );
        return null;
      }

      const data = await response.json();
      return this.mapExperience(data.data);
    } catch (error) {
      this.logger.error(`Amadeus experience details error: ${error.message}`);
      return null;
    }
  }

  private mapSearchResults(data: any): ExperienceSearchResult[] {
    if (!data?.data || !Array.isArray(data.data)) return [];

    return data.data.map((item: any) => this.mapExperience(item));
  }

  private mapExperience(item: any): ExperienceSearchResult {
    return {
      provider: "amadeus",
      experienceId: item.id,
      name: item.name,
      description: item.description,
      shortDescription: item.shortDescription,
      photos: item.pictures || [],
      price: parseFloat(item.price?.amount || "0"),
      currency: item.price?.currencyCode || "USD",
      rating: parseFloat(item.rating || "0"),
      bookingLink: item.bookingLink,
      minimumDuration: item.minimumDuration,
    };
  }
}
