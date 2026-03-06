// src/modules/integrations/providers/duffel-stays.provider.ts
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  StaysAdapter,
  StaysSearchQuery,
  StaysSearchResult,
  StaysRoomResult,
  StaysBookingResult,
} from "../interfaces/stays-adapter.interface";

@Injectable()
export class DuffelStaysProvider implements StaysAdapter {
  readonly providerName = "duffel";
  private readonly logger = new Logger(DuffelStaysProvider.name);

  private readonly baseUrl = "https://api.duffel.com";
  private readonly accessToken: string;

  constructor(private configService: ConfigService) {
    this.accessToken =
      this.configService.get<string>("DUFFEL_ACCESS_TOKEN") || "";
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Duffel-Version": "v2",
      Accept: "application/json",
      "Content-Type": "application/json",
      "Accept-Encoding": "gzip",
    };
  }

  /**
   * Search for accommodation via Duffel Stays Search API
   */
  async searchStays(query: StaysSearchQuery): Promise<StaysSearchResult[]> {
    this.logger.log(
      `Searching Duffel Stays: ${query.location?.latitude},${query.location?.longitude}`,
    );

    try {
      const requestBody: any = {
        data: {
          check_in_date: query.checkInDate,
          check_out_date: query.checkOutDate,
          rooms: query.rooms || 1,
          guests: query.guests.map((g) => ({
            type: g.type || "adult",
            ...(g.age !== undefined ? { age: g.age } : {}),
          })),
        },
      };

      // Search by location or accommodation
      if (query.accommodationId) {
        requestBody.data.accommodation = {
          fetch_rate_comments: false,
          ids: [query.accommodationId],
        };
      } else if (query.location) {
        requestBody.data.location = {
          geographic_coordinates: {
            latitude: query.location.latitude,
            longitude: query.location.longitude,
          },
          radius: query.location.radius || 5,
        };
      }

      if (query.freeCancellationOnly) {
        requestBody.data.free_cancellation_only = true;
      }

      const response = await fetch(`${this.baseUrl}/stays/search`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Duffel Stays search failed: ${response.status} ${errorBody}`,
        );
        return [];
      }

      const data = await response.json();
      return this.mapSearchResults(data, query);
    } catch (error) {
      this.logger.error(
        `Duffel Stays search error: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Map Duffel search response to unified format
   */
  private mapSearchResults(
    data: any,
    query: StaysSearchQuery,
  ): StaysSearchResult[] {
    const results = data?.data?.results || [];

    return results.map((result: any) => {
      const accommodation = result.accommodation || {};
      const location = accommodation.location || {};
      const address = location.address || {};
      const coords = location.geographic_coordinates || {};

      return {
        provider: "duffel",
        accommodationId: accommodation.id || "",
        name: accommodation.name || "Unknown",
        description: accommodation.description,
        photos: (accommodation.photos || []).map((p: any) => p.url),
        rating: accommodation.rating,
        reviewScore: accommodation.review_score,
        reviewCount: accommodation.review_count,
        location: {
          latitude: coords.latitude || 0,
          longitude: coords.longitude || 0,
          address: address.line_one || "",
          city: address.city_name || "",
          countryCode: address.country_code || "",
        },
        cheapestPrice: parseFloat(result.cheapest_rate_total_amount || "0"),
        priceWithCommission: parseFloat(
          result.cheapest_rate_total_amount || "0",
        ), // Set by integration service
        currency: result.cheapest_rate_currency || "USD",
        amenities: (accommodation.amenities || []).map((a: any) => ({
          type: a.type,
          description: a.description,
        })),
        checkInDate: result.check_in_date || query.checkInDate,
        checkOutDate: result.check_out_date || query.checkOutDate,
        checkInTime: accommodation.check_in_information?.check_in_after_time,
        checkOutTime: accommodation.check_in_information?.check_out_before_time,
        brand: accommodation.brand?.name,
        chain: accommodation.chain?.name,
        expiresAt: result.expires_at,
        searchResultId: result.id,
      } as StaysSearchResult;
    });
  }

  /**
   * Get detailed accommodation info
   */
  async getAccommodationDetails(
    accommodationId: string,
  ): Promise<Partial<StaysSearchResult>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/stays/accommodation/${accommodationId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(30000),
        },
      );

      if (!response.ok) return {};
      const data = await response.json();
      const accommodation = data?.data;
      if (!accommodation) return {};

      return {
        accommodationId: accommodation.id,
        name: accommodation.name,
        description: accommodation.description,
        photos: (accommodation.photos || []).map((p: any) => p.url),
        rating: accommodation.rating,
        location: {
          latitude:
            accommodation.location?.geographic_coordinates?.latitude || 0,
          longitude:
            accommodation.location?.geographic_coordinates?.longitude || 0,
          address: accommodation.location?.address?.line_one || "",
          city: accommodation.location?.address?.city_name || "",
          countryCode: accommodation.location?.address?.country_code || "",
        },
        amenities: (accommodation.amenities || []).map((a: any) => ({
          type: a.type,
          description: a.description,
        })),
      };
    } catch (error) {
      this.logger.error(`Duffel accommodation details error: ${error.message}`);
      return {};
    }
  }

  /**
   * Fetch all rooms and rates for a search result
   */
  async fetchRates(searchResultId: string): Promise<StaysRoomResult[]> {
    this.logger.log(
      `Fetching Duffel rates for search result ${searchResultId}`,
    );

    try {
      const response = await fetch(
        `${this.baseUrl}/stays/search_results/${searchResultId}/actions/fetch_all_rates`,
        {
          method: "POST",
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(30000),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Duffel fetch rates failed: ${response.status} ${errorBody}`,
        );
        return [];
      }

      const data = await response.json();
      const accommodation = data?.data?.accommodation || {};

      return (accommodation.rooms || []).map((room: any) => ({
        name: room.name,
        photos: (room.photos || []).map((p: any) => p.url),
        beds: room.beds || [],
        rates: (room.rates || []).map((rate: any) => ({
          rateId: rate.id,
          price: parseFloat(rate.total_amount || "0"),
          priceWithCommission: parseFloat(rate.total_amount || "0"), // Set by integration service
          currency: rate.total_currency || "USD",
          boardType: rate.board_type,
          paymentType: rate.payment_type,
          cancellationTimeline: (rate.cancellation_timeline || []).map(
            (ct: any) => ({
              before: ct.before,
              refundAmount: ct.refund_amount,
              currency: ct.currency,
            }),
          ),
          conditions: rate.conditions || [],
          expiresAt: rate.expires_at,
        })),
      }));
    } catch (error) {
      this.logger.error(
        `Duffel fetch rates error: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Create a quote (price confirmation) for a selected rate
   */
  async createQuote(rateId: string): Promise<any> {
    this.logger.log(`Creating Duffel quote for rate ${rateId}`);

    try {
      const response = await fetch(`${this.baseUrl}/stays/quotes`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          data: { rate_id: rateId },
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Duffel quote creation failed: ${response.status} ${errorBody}`,
        );
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      this.logger.error(
        `Duffel create quote error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create a stays booking from a quote
   */
  async createBooking(
    quoteId: string,
    guestDetails: any,
  ): Promise<StaysBookingResult> {
    this.logger.log(`Creating Duffel stays booking for quote ${quoteId}`);

    try {
      const requestBody: any = {
        data: {
          quote_id: quoteId,
          email: guestDetails.email,
          phone_number: guestDetails.phoneNumber,
          guests: (guestDetails.guests || []).map((g: any) => ({
            given_name: g.firstName,
            family_name: g.lastName,
          })),
        },
      };

      if (guestDetails.specialRequests) {
        requestBody.data.accommodation_special_requests =
          guestDetails.specialRequests;
      }

      const response = await fetch(`${this.baseUrl}/stays/bookings`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Duffel stays booking failed: ${response.status} ${errorBody}`,
        );
      }

      const data = await response.json();
      const booking = data.data;

      return {
        bookingId: booking.id,
        reference: booking.reference,
        status: booking.status,
        accommodationName: booking.accommodation?.name || "Unknown",
        checkInDate: booking.check_in_date,
        checkOutDate: booking.check_out_date,
        confirmedAt: booking.confirmed_at,
      };
    } catch (error) {
      this.logger.error(
        `Duffel stays booking error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Cancel a stays booking
   */
  async cancelBooking(bookingId: string): Promise<any> {
    this.logger.log(`Cancelling Duffel stays booking ${bookingId}`);

    try {
      const response = await fetch(
        `${this.baseUrl}/stays/bookings/${bookingId}/actions/cancel`,
        {
          method: "POST",
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(30000),
        },
      );

      if (!response.ok) {
        throw new Error(`Duffel stays cancel failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        booking: data.data,
      };
    } catch (error) {
      this.logger.error(
        `Duffel stays cancel error: ${error.message}`,
        error.stack,
      );
      return { success: false };
    }
  }
}
