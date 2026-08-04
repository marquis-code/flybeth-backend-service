import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ExperiencesAdapter,
  ExperienceSearchQuery,
  ExperienceSearchResult,
} from "../interfaces/experiences-adapter.interface";

@Injectable()
export class ViatorExperiencesProvider implements ExperiencesAdapter {
  readonly providerName = "viator";
  private readonly logger = new Logger(ViatorExperiencesProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.viator.com/partner"; // Use sandbox for testing if needed

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>("VIATOR_API_KEY") || "";
    if (!this.apiKey) {
      this.logger.warn("VIATOR_API_KEY is not set in environment variables.");
    }
  }

  private getHeaders() {
    return {
      "exp-api-key": this.apiKey,
      "Accept-Language": "en-US",
      "Accept": "application/json;version=2.0",
      "Content-Type": "application/json",
    };
  }

  /**
   * Search for experiences using Viator's free-text search.
   * If query is missing, we fallback to a generic search or return empty,
   * since Viator doesn't support native lat/long radius search.
   */
  async searchExperiences(
    query: ExperienceSearchQuery,
  ): Promise<ExperienceSearchResult[]> {
    if (!query.query) {
      this.logger.warn(
        "Viator requires a text query for search. Lat/Long search is not natively supported without destination ID mapping.",
      );
      return [];
    }

    this.logger.log(`Searching Viator activities for query: ${query.query}`);

    try {
      const url = `${this.baseUrl}/search/freetext`;
      const body = {
        searchTerm: query.query,
        searchTypes: [
          {
            searchType: "PRODUCTS",
            pagination: { start: 1, count: 50 },
          },
        ],
        currency: "USD",
      };

      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`Viator search failed: ${response.status} ${errText}`);
        return [];
      }

      const data = await response.json();
      const products = data.products?.results || [];

      return products.map((item: any) => ({
        provider: this.providerName,
        experienceId: item.productCode,
        name: item.title,
        description: item.description || "",
        shortDescription: item.description?.substring(0, 100) || "",
        photos: item.image?.variants?.map((v: any) => v.url) || [],
        price: item.pricing?.summary?.fromPrice || 0,
        currency: "USD", // default requested currency
        rating: item.reviews?.combinedAverageRating || null,
        bookingLink: item.productUrl || "",
        minimumDuration: item.duration?.fixedDurationInMinutes
          ? `${item.duration.fixedDurationInMinutes} minutes`
          : undefined,
      }));
    } catch (error) {
      this.logger.error(`Error in Viator searchExperiences: ${error}`);
      return [];
    }
  }

  /**
   * Get full details for a specific Viator product.
   */
  async getExperienceDetails(
    experienceId: string,
  ): Promise<ExperienceSearchResult | null> {
    try {
      const url = `${this.baseUrl}/products/${experienceId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`Viator get product failed: ${response.status} ${errText}`);
        return null;
      }

      const item = await response.json();

      return {
        provider: this.providerName,
        experienceId: item.productCode,
        name: item.title,
        description: item.description || "",
        shortDescription: item.description?.substring(0, 100) || "",
        photos: item.images?.map((img: any) => img.variants?.[0]?.url).filter(Boolean) || [],
        price: item.pricingInfo?.summary?.fromPrice || 0,
        currency: "USD",
        rating: item.reviews?.combinedAverageRating || null,
        bookingLink: item.productUrl || "",
      };
    } catch (error) {
      this.logger.error(`Error in Viator getExperienceDetails: ${error}`);
      return null;
    }
  }

  /**
   * Book an experience. Viator uses a cart/hold then cart/book flow.
   * This is a simplified implementation. A real implementation needs pax mix, dates, and options.
   */
  async bookExperience(bookingData: any): Promise<any> {
    try {
      // Step 1: Hold
      const holdUrl = `${this.baseUrl}/bookings/cart/hold`;
      // The payload structure is simplified here; refer to OpenAPI for full schema requirements
      const holdBody = {
        currency: "USD",
        items: [
          {
            productCode: bookingData.experienceId,
            productOptionCode: bookingData.optionCode,
            travelDate: bookingData.date,
            paxMix: bookingData.guests.map((g: any) => ({
              ageBand: g.type === "adult" ? "ADULT" : "CHILD",
              numberOfTravelers: 1,
            })),
          },
        ],
      };

      const holdRes = await fetch(holdUrl, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(holdBody),
      });

      if (!holdRes.ok) {
        throw new Error(`Hold failed: ${await holdRes.text()}`);
      }

      const holdData = await holdRes.json();
      const cartRef = holdData.cartRef;

      // Step 2: Book
      const bookUrl = `${this.baseUrl}/bookings/cart/book`;
      const bookBody = {
        cartRef: cartRef,
        bookerInfo: {
          firstName: bookingData.contactName.split(" ")[0],
          lastName: bookingData.contactName.split(" ").slice(1).join(" "),
        },
        communication: {
          email: bookingData.contactEmail,
          phone: bookingData.contactPhone,
        },
        partnerBookingRef: `FB-${Date.now()}`,
      };

      const bookRes = await fetch(bookUrl, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(bookBody),
      });

      if (!bookRes.ok) {
        throw new Error(`Book failed: ${await bookRes.text()}`);
      }

      return await bookRes.json();
    } catch (error) {
      this.logger.error(`Error in Viator bookExperience: ${error}`);
      throw error;
    }
  }

  /**
   * Cancel a booking.
   */
  async cancelBooking(reference: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/bookings/${reference}/cancel`;
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          reasonCode: "CUSTOMER_CHANGED_MIND",
        }),
      });

      if (!response.ok) {
        throw new Error(`Cancel failed: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Error in Viator cancelBooking: ${error}`);
      throw error;
    }
  }
}
