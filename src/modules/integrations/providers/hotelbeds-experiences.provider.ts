// src/modules/integrations/providers/hotelbeds-experiences.provider.ts
import { Injectable, Logger } from "@nestjs/common";
import {
  ExperiencesAdapter,
  ExperienceSearchQuery,
  ExperienceSearchResult,
} from "../interfaces/experiences-adapter.interface";
import { HotelbedsHelperService } from "./hotelbeds-helper.service";

@Injectable()
export class HotelbedsExperiencesProvider implements ExperiencesAdapter {
  readonly providerName = "hotelbeds-activities";
  private readonly logger = new Logger(HotelbedsExperiencesProvider.name);

  constructor(private helper: HotelbedsHelperService) {}

  /**
   * Search for available activities using HotelBeds Activities Booking API
   * Endpoint: GET /activity-api/3.0/activities
   */
  async searchExperiences(
    query: ExperienceSearchQuery,
  ): Promise<ExperienceSearchResult[]> {
    this.logger.log(
      `Searching HotelBeds activities near [${query.latitude}, ${query.longitude}]`,
    );

    try {
      // Build query params for activity search
      const params = new URLSearchParams({
        language: "en",
      });

      // Use geolocation for search
      if (query.latitude && query.longitude) {
        params.append("latitude", String(query.latitude));
        params.append("longitude", String(query.longitude));
        params.append("radius", String(query.radius || 20));
      }

      const url = `${this.helper.baseUrl}/activity-api/3.0/activities?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.helper.getHeadersFor("activities"),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(
          `HotelBeds activities search failed: ${response.status} ${errText}`,
        );
        return [];
      }

      const data = await response.json();
      return this.mapSearchResults(data);
    } catch (error) {
      this.logger.error(`HotelBeds activities search error: ${error.message}`);
      return [];
    }
  }

  /**
   * Get detailed information for a specific activity
   * Endpoint: GET /activity-api/3.0/activities/details
   */
  async getExperienceDetails(
    experienceId: string,
  ): Promise<ExperienceSearchResult | null> {
    this.logger.log(`Fetching HotelBeds activity details: ${experienceId}`);

    try {
      const params = new URLSearchParams({
        codes: experienceId,
        language: "en",
      });

      const url = `${this.helper.baseUrl}/activity-api/3.0/activities/details?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.helper.getHeadersFor("activities"),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(
          `HotelBeds activity details failed: ${response.status} ${errText}`,
        );
        return null;
      }

      const data = await response.json();

      if (!data.activities || data.activities.length === 0) return null;

      const activity = data.activities[0];
      return this.mapActivity(activity);
    } catch (error) {
      this.logger.error(`HotelBeds activity details error: ${error.message}`);
      return null;
    }
  }

  /**
   * Search activities by destination code
   * Endpoint: GET /activity-api/3.0/activities
   */
  async searchByDestination(
    destinationCode: string,
  ): Promise<ExperienceSearchResult[]> {
    this.logger.log(
      `Searching HotelBeds activities for destination: ${destinationCode}`,
    );

    try {
      const params = new URLSearchParams({
        language: "en",
        destinationCode: destinationCode,
      });

      const url = `${this.helper.baseUrl}/activity-api/3.0/activities?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.helper.getHeadersFor("activities"),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(
          `HotelBeds activities destination search failed: ${response.status} ${errText}`,
        );
        return [];
      }

      const data = await response.json();
      return this.mapSearchResults(data);
    } catch (error) {
      this.logger.error(
        `HotelBeds activities destination search error: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Check availability and pricing for a specific activity on specific dates
   * Endpoint: GET /activity-api/3.0/activities/availability
   */
  async checkAvailability(
    activityCode: string,
    dateFrom: string,
    dateTo: string,
    paxes: { adults: number; children?: number },
  ): Promise<any> {
    this.logger.log(
      `Checking HotelBeds activity availability: ${activityCode}`,
    );

    try {
      const params = new URLSearchParams({
        codes: activityCode,
        language: "en",
        from: dateFrom,
        to: dateTo,
      });

      const url = `${this.helper.baseUrl}/activity-api/3.0/activities/availability?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.helper.getHeadersFor("activities"),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(
          `HotelBeds activity availability check failed: ${response.status} ${errText}`,
        );
        return null;
      }

      return await response.json();
    } catch (error) {
      this.logger.error(
        `HotelBeds activity availability error: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Confirm an activity booking
   * Endpoint: POST /activity-api/3.0/bookings
   */
  async bookActivity(bookingData: {
    activityCode: string;
    modalityCode: string;
    rateKey: string;
    dateFrom: string;
    dateTo: string;
    holder: { name: string; surname: string; email?: string; phone?: string };
    paxes: Array<{ name: string; surname: string; type: string; age?: number }>;
  }): Promise<any> {
    this.logger.log(`Booking HotelBeds activity: ${bookingData.activityCode}`);

    try {
      const body = {
        language: "en",
        clientReference: `FLYBETH-${Date.now()}`,
        holder: bookingData.holder,
        activities: [
          {
            rateKey: bookingData.rateKey,
            from: bookingData.dateFrom,
            to: bookingData.dateTo,
            paxes: bookingData.paxes,
          },
        ],
      };

      const response = await fetch(
        `${this.helper.baseUrl}/activity-api/3.0/bookings`,
        {
          method: "POST",
          headers: this.helper.getHeadersFor("activities"),
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          `HotelBeds activity booking failed: ${response.status} ${errText}`,
        );
      }

      const data = await response.json();
      return {
        bookingId: data.booking?.reference || data.reference,
        status: data.booking?.status || "CONFIRMED",
        clientReference: data.booking?.clientReference,
      };
    } catch (error) {
      this.logger.error(`HotelBeds activity booking error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel an activity booking
   * Endpoint: DELETE /activity-api/3.0/bookings/{language}/{reference}
   */
  async cancelBooking(reference: string): Promise<any> {
    this.logger.log(`Cancelling HotelBeds activity booking: ${reference}`);

    try {
      const response = await fetch(
        `${this.helper.baseUrl}/activity-api/3.0/bookings/en/${reference}`,
        {
          method: "DELETE",
          headers: this.helper.getHeadersFor("activities"),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        return { status: "FAILED", message: errText };
      }

      const data = await response.json();
      return {
        status: "CANCELLED",
        reference: data.booking?.reference || reference,
        cancellationReference: data.booking?.cancellationReference,
      };
    } catch (error) {
      this.logger.error(
        `HotelBeds activity cancellation error: ${error.message}`,
      );
      return { status: "ERROR", message: error.message };
    }
  }

  /**
   * Map HotelBeds Activities response to ExperienceSearchResult[]
   */
  private mapSearchResults(data: any): ExperienceSearchResult[] {
    if (!data?.activities || !Array.isArray(data.activities)) return [];

    return data.activities
      .map((activity: any) => this.mapActivity(activity))
      .filter(Boolean) as ExperienceSearchResult[];
  }

  private mapActivity(activity: any): ExperienceSearchResult {
    // Get the cheapest modality price
    const cheapestModality = activity.modalities
      ?.flatMap((m: any) => m.rates || [])
      ?.sort((a: any, b: any) => (a.amount || 0) - (b.amount || 0))?.[0];

    // Get photos
    const photos =
      activity.media
        ?.filter((m: any) => m.mediaType === "IMAGE")
        ?.map((m: any) => m.url)
        ?.slice(0, 5) || [];

    return {
      provider: this.providerName,
      experienceId: activity.code || activity.activityCode,
      name: activity.name || "",
      description: activity.description || activity.content?.description || "",
      shortDescription: activity.shortDescription || activity.summary || "",
      photos,
      price: cheapestModality?.amount || activity.amountFrom || 0,
      currency: cheapestModality?.currencyId || activity.currencyId || "EUR",
      rating: activity.scoring?.averageValue || undefined,
      bookingLink: undefined,
      minimumDuration: activity.duration?.value
        ? `${activity.duration.value} ${activity.duration.metric || "hours"}`
        : undefined,
    };
  }
}
