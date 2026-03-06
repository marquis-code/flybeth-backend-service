// src/modules/integrations/providers/amadeus-hotels.provider.ts
import { Injectable, Logger } from "@nestjs/common";
import {
  StaysAdapter,
  StaysSearchQuery,
  StaysSearchResult,
  StaysRoomResult,
  StaysBookingResult,
} from "../interfaces/stays-adapter.interface";
import { AmadeusHelperService } from "./amadeus-helper.service";

@Injectable()
export class AmadeusHotelsProvider implements StaysAdapter {
  readonly providerName = "amadeus";
  private readonly logger = new Logger(AmadeusHotelsProvider.name);

  constructor(private amadeusHelper: AmadeusHelperService) {}

  async searchStays(query: StaysSearchQuery): Promise<StaysSearchResult[]> {
    this.logger.log(
      `Searching Amadeus Stays: ${query.location?.latitude},${query.location?.longitude}`,
    );

    try {
      const token = await this.amadeusHelper.getAccessToken();
      let hotelIds: string[] = [];

      // 1. Get Hotel IDs by Geocode
      if (query.location?.latitude && query.location?.longitude) {
        const geoParams = new URLSearchParams({
          latitude: String(query.location.latitude),
          longitude: String(query.location.longitude),
          radius: String(query.location.radius || 10),
          radiusUnit: "KM",
        });

        const geoResponse = await fetch(
          `${this.amadeusHelper.baseUrl}/v1/reference-data/locations/hotels/by-geocode?${geoParams}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          hotelIds = geoData.data?.map((h: any) => h.hotelId) || [];
        }
      }

      if (hotelIds.length === 0) {
        this.logger.warn("No hotels found in the given location");
        return [];
      }

      // Limit to 40 hotels (Amadeus batch limit is usually 50)
      const subset = hotelIds.slice(0, 40);

      // 2. Get Offers for these Hotels
      const adults = query.guests.filter((g) => g.type === "adult").length || 1;
      const offerParams = new URLSearchParams({
        hotelIds: subset.join(","),
        adults: String(adults),
        checkInDate: query.checkInDate,
        checkOutDate: query.checkOutDate,
        roomQuantity: String(query.rooms || 1),
        currencyCode: "USD",
        bestRateOnly: "true",
      });

      const response = await fetch(
        `${this.amadeusHelper.baseUrl}/v3/shopping/hotel-offers?${offerParams}`,
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
          `Amadeus hotel offers failed: ${response.status} ${errText}`,
        );
        return [];
      }

      const data = await response.json();
      return this.mapSearchResults(data, query.checkInDate, query.checkOutDate);
    } catch (error) {
      this.logger.error(
        `Amadeus stays search error: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async getAccommodationDetails(
    accommodationId: string,
  ): Promise<Partial<StaysSearchResult>> {
    this.logger.log(`Fetching Amadeus hotel details for: ${accommodationId}`);
    try {
      const token = await this.amadeusHelper.getAccessToken();
      const response = await fetch(
        `${this.amadeusHelper.baseUrl}/v1/reference-data/locations/hotels/by-hotels?hotelIds=${accommodationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) return {};
      const data = await response.json();
      const hotel = data.data?.[0];
      if (!hotel) return {};

      return {
        accommodationId: hotel.hotelId,
        name: hotel.name,
        location: {
          latitude: hotel.latitude,
          longitude: hotel.longitude,
          city: hotel.cityCode,
          address: "",
          countryCode: hotel.address?.countryCode || "",
        },
      };
    } catch (error) {
      this.logger.error(
        `Amadeus getAccommodationDetails error: ${error.message}`,
      );
      return {};
    }
  }

  async fetchRates(searchResultId: string): Promise<StaysRoomResult[]> {
    this.logger.log(`Fetching Amadeus hotel rates for: ${searchResultId}`);

    try {
      const token = await this.amadeusHelper.getAccessToken();
      const response = await fetch(
        `${this.amadeusHelper.baseUrl}/v3/shopping/hotel-offers/${searchResultId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Amadeus fetchRates failed: ${response.status}`);
      }

      const data = await response.json();
      const hotelOffer = data.data; // v3 details returns data as a single offer object or array?
      // Usually returns a single hotel object with offers in it

      if (!hotelOffer || !hotelOffer.offers) return [];

      return hotelOffer.offers.map((offer: any) => ({
        roomId: offer.id,
        name: offer.room?.typeEstimated?.category || "Standard Room",
        description:
          offer.room?.description?.text || "Standard Room Description",
        photos: [], // Amadeus v3 doesn't return images directly
        beds: [],
        rates: [
          {
            rateId: offer.id,
            name: offer.ratePlanCode || "Standard Rate",
            price: parseFloat(offer.price?.total || "0"),
            priceWithCommission: 0, // Set by integration service
            currency: offer.price?.currency || "USD",
            boardType: offer.boardType || "ROOM_ONLY",
            conditions: [
              {
                title: "Cancellation Policy",
                description:
                  offer.policies?.cancellation?.description?.text ||
                  "Standard cancellation policy",
              },
            ],
          },
        ],
      }));
    } catch (error) {
      this.logger.error(`Amadeus fetchRates error: ${error.message}`);
      return [];
    }
  }

  async createQuote(rateId: string): Promise<any> {
    // Amadeus v3 doesn't have a separate "quote" endpoint,
    // the offer ID is used directly for booking or re-read details.
    // We can just return the rateId as the quoteId.
    return { quoteId: rateId };
  }

  async createBooking(
    quoteId: string,
    guestDetails: any,
  ): Promise<StaysBookingResult> {
    this.logger.log(`Creating Amadeus hotel booking for: ${quoteId}`);
    try {
      const token = await this.amadeusHelper.getAccessToken();
      // Using v1/v2 booking. Postman says v1 /v1/booking/hotel-bookings
      const response = await fetch(
        `${this.amadeusHelper.baseUrl}/v1/booking/hotel-bookings`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              offerId: quoteId,
              guests: [
                {
                  id: 1,
                  name: {
                    title: "MR",
                    firstName: guestDetails.firstName,
                    lastName: guestDetails.lastName,
                  },
                  contact: {
                    phone: guestDetails.phone,
                    email: guestDetails.email,
                  },
                },
              ],
              payments: [
                {
                  id: 1,
                  method: "creditCard",
                  card: {
                    vendorCode: guestDetails.cardVendor || "VI",
                    cardNumber: guestDetails.cardNumber || "4111111111111111",
                    expiryDate: guestDetails.cardExpiry || "2026-12",
                  },
                },
              ],
              rooms: [
                {
                  guestIds: [1],
                  paymentId: 1,
                },
              ],
            },
          }),
        },
      );

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(
          `Amadeus hotel booking failed: ${response.status} ${errBody}`,
        );
      }

      const data = await response.json();
      const booking = data.data?.[0] || data.data;

      return {
        bookingId: booking.id || booking.associatedRecords?.[0]?.reference,
        status: "CONFIRMED",
        reference: booking.associatedRecords?.[0]?.reference || booking.id,
        accommodationName: guestDetails.accommodationName || "Amadeus Hotel",
        checkInDate: guestDetails.checkInDate || "",
        checkOutDate: guestDetails.checkOutDate || "",
      };
    } catch (error) {
      this.logger.error(`Amadeus booking error: ${error.message}`);
      throw error;
    }
  }

  async cancelBooking(bookingId: string): Promise<any> {
    // Amadeus hotel cancellation often requires a custom logic or is not always available via REST
    // For now, return status
    return {
      success: false,
      message: "Cancellation via API not fully supported for this provider",
    };
  }

  private mapSearchResults(
    data: any,
    checkInDate: string,
    checkOutDate: string,
  ): StaysSearchResult[] {
    if (!data?.data || !Array.isArray(data.data)) return [];

    return data.data.map((hotelOffer: any) => {
      const hotel = hotelOffer.hotel;
      const offer = hotelOffer.offers?.[0];

      return {
        provider: "amadeus",
        accommodationId: hotel.hotelId,
        name: hotel.name,
        description: hotel.name, // Amadeus v3 doesn't give long desc in search
        photos: [],
        location: {
          address: "",
          city: hotel.cityCode,
          countryCode: "", // Amadeus v3 doesn't give country alpha-2 in search?
          latitude: hotel.latitude,
          longitude: hotel.longitude,
        },
        cheapestPrice: parseFloat(offer?.price?.total || "0"),
        priceWithCommission: 0, // Set by integration service
        currency: offer?.price?.currency || "USD",
        rating: 4, // Amadeus v3 doesn't always provide star rating in search
        amenities: [],
        checkInDate,
        checkOutDate,
        searchResultId: hotel.hotelId,
      };
    });
  }
}
