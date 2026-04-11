// src/modules/integrations/providers/duffel.provider.ts
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AirlineAdapter,
  FlightSearchQuery,
  FlightSearchResult,
  FlightSegment,
} from "../interfaces/airline-adapter.interface";

@Injectable()
export class DuffelProvider implements AirlineAdapter {
  readonly providerName = "duffel";
  private readonly logger = new Logger(DuffelProvider.name);

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
   * Search flights via Duffel Offer Requests API
   */
  async searchFlights(query: FlightSearchQuery): Promise<FlightSearchResult[]> {
    this.logger.log(
      `Searching Duffel: ${query.origin} -> ${query.destination} on ${query.departureDate}`,
    );

    try {
      // Build passengers array
      const passengers: any[] = [];
      for (let i = 0; i < (query.adults || 1); i++) {
        passengers.push({ type: "adult" });
      }
      for (let i = 0; i < (query.children || 0); i++) {
        passengers.push({ age: 10 }); // Using age rather than type per Duffel recommendation
      }
      for (let i = 0; i < (query.infants || 0); i++) {
        passengers.push({ age: 1 });
      }

      // Build slices
      const slices: any[] = [
        {
          origin: query.origin.toUpperCase(),
          destination: query.destination.toUpperCase(),
          departure_date: query.departureDate,
        },
      ];

      // Return slice for round trips
      if (query.returnDate) {
        slices.push({
          origin: query.destination.toUpperCase(),
          destination: query.origin.toUpperCase(),
          departure_date: query.returnDate,
        });
      }

      const requestBody: any = {
        data: {
          slices,
          passengers,
          cabin_class: this.mapCabinClass(query.class),
        },
      };

      if (query.maxConnections !== undefined) {
        requestBody.data.max_connections = query.maxConnections;
      }

      const response = await fetch(`${this.baseUrl}/air/offer_requests`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(130000), // 130s as per Duffel docs
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Duffel search failed: ${response.status} ${errorBody}`,
        );
        return [];
      }

      const data = await response.json();
      return this.mapDuffelOffers(data);
    } catch (error) {
      this.logger.error(`Duffel search error: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Price a flight offer through the correct provider
   * In Duffel, this is simply GET /air/offers/:id which returns up-to-date pricing
   */
  async priceOffer(offer: any): Promise<any> {
    const offerId =
      typeof offer === "string" ? offer : offer.id || offer.offerId;
    this.logger.log(`Pricing Duffel offer: ${offerId}`);

    try {
      const updatedOffer = await this.getOfferDetails(offerId);
      if (!updatedOffer) throw new Error("Offer not found");

      return {
        data: {
          flightOffers: [updatedOffer.rawOffer || updatedOffer],
        },
      };
    } catch (error) {
      this.logger.error(`Duffel price offer error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get seatmap through the correct provider
   */
  async getSeatmap(flightOffer: any): Promise<any> {
    const offerId =
      typeof flightOffer === "string"
        ? flightOffer
        : flightOffer.id || flightOffer.offerId;
    this.logger.log(`Fetching seatmap for Duffel offer: ${offerId}`);

    try {
      const response = await fetch(
        `${this.baseUrl}/air/seat_maps?offer_id=${offerId}`,
        {
          method: "GET",
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(30000),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Duffel seatmap failed: ${response.status} ${errorBody}`,
        );
        throw new Error(`Duffel seatmap failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      this.logger.error(`Duffel seatmap error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get up-to-date details for a specific offer
   */
  async getOfferDetails(offerId: string): Promise<FlightSearchResult | null> {
    try {
      const response = await fetch(`${this.baseUrl}/air/offers/${offerId}`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        this.logger.error(`Duffel offer details failed: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const results = this.mapDuffelOffers({
        data: { offers: [data.data] },
      });
      return results[0] || null;
    } catch (error) {
      this.logger.error(`Duffel offer details error: ${error.message}`);
      return null;
    }
  }

  /**
   * Map Duffel offers response to our unified format
   */
  private mapDuffelOffers(data: any): FlightSearchResult[] {
    const offers = data?.data?.offers || [];
    return offers.map((offer: any) => {
      const firstSlice = offer.slices?.[0];
      const allSegments: FlightSegment[] = [];

      // Flatten all segments from all slices
      (offer.slices || []).forEach((slice: any) => {
        (slice.segments || []).forEach((seg: any) => {
          allSegments.push({
            flightNumber: `${seg.marketing_carrier?.iata_code || ""}${seg.marketing_carrier_flight_number || ""}`,
            airline:
              seg.operating_carrier?.name ||
              seg.marketing_carrier?.name ||
              "Unknown",
            airlineLogo:
              seg.operating_carrier?.logo_symbol_url ||
              seg.marketing_carrier?.logo_symbol_url,
            origin: seg.origin?.iata_code,
            destination: seg.destination?.iata_code,
            originTerminal: seg.origin_terminal,
            destinationTerminal: seg.destination_terminal,
            departureTime: seg.departing_at,
            arrivalTime: seg.arriving_at,
            duration: this.parseDuffelDuration(seg.duration),
            aircraft: seg.aircraft?.name,
            operatingCarrier: seg.operating_carrier?.name,
            marketingCarrier: seg.marketing_carrier?.name,
          });
        });
      });

      const firstSegment = allSegments[0];
      const lastSegmentOfFirstSlice =
        firstSlice?.segments?.[firstSlice.segments.length - 1];
      const price = parseFloat(offer.total_amount || "0");

      return {
        provider: "duffel",
        offerId: offer.id,
        airline: offer.owner?.name || firstSegment?.airline || "Unknown",
        airlineLogo: offer.owner?.logo_symbol_url || firstSegment?.airlineLogo,
        flightNumbers: allSegments.map((s) => s.flightNumber),
        origin: firstSlice?.origin?.iata_code || firstSegment?.origin,
        destination:
          firstSlice?.destination?.iata_code ||
          lastSegmentOfFirstSlice?.destination?.iata_code,
        departureTime: firstSegment?.departureTime,
        arrivalTime:
          lastSegmentOfFirstSlice?.arriving_at ||
          allSegments[allSegments.length - 1]?.arrivalTime,
        duration: this.parseDuffelDuration(firstSlice?.duration),
        price,
        priceWithCommission: price, // Will be set by integration service
        currency: offer.total_currency || "USD",
        seatsAvailable: offer.available_services?.length || undefined,
        stops: (firstSlice?.segments?.length || 1) - 1,
        segments: allSegments,
        cabinClass:
          offer.slices?.[0]?.segments?.[0]?.passengers?.[0]?.cabin_class ||
          "economy",
        expiresAt: offer.expires_at,
        conditions: {
          refundable:
            offer.conditions?.refund_before_departure?.allowed === true,
          changeable:
            offer.conditions?.change_before_departure?.allowed === true,
          refundPenalty:
            offer.conditions?.refund_before_departure?.penalty_amount,
          changePenalty:
            offer.conditions?.change_before_departure?.penalty_amount,
        },
        totalEmissionsKg: offer.total_emissions_kg
          ? parseFloat(offer.total_emissions_kg)
          : undefined,
        rawOffer: offer,
      } as FlightSearchResult;
    });
  }

  /**
   * Parse Duffel duration format (PT2H30M or ISO 8601) to minutes
   */
  private parseDuffelDuration(duration?: string): number {
    if (!duration) return 0;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    return parseInt(match[1] || "0") * 60 + parseInt(match[2] || "0");
  }

  /**
   * Map our cabin class to Duffel's format
   */
  private mapCabinClass(cabinClass?: string): string {
    const map: Record<string, string> = {
      economy: "economy",
      premium_economy: "premium_economy",
      business: "business",
      first: "first",
    };
    return map[cabinClass || "economy"] || "economy";
  }

  /**
   * Book a flight via Duffel Orders API
   */
  async bookFlight(
    offerId: string,
    passengers: any[],
    payment?: any,
    offer?: any,
  ): Promise<{ pnr: string; orderId: string; ticketNumbers?: string[] }> {
    this.logger.log(
      `Booking Duffel flight ${offerId} for ${passengers.length} passengers. Offer provided: ${!!offer}`,
    );
    if (offer) {
      this.logger.log(
        `Offer rawOffer passengers count: ${offer.rawOffer?.passengers?.length}`,
      );
    }

    try {
      // First check if offer is still valid
      const offerDetails = await this.getOfferDetails(offerId);
      if (!offerDetails) {
        throw new Error("Offer not found or expired");
      }

      const requestBody: any = {
        data: {
          type: "instant",
          selected_offers: [offerId],
          passengers: passengers.map((p, i) => {
            // Use the actual passenger ID assigned by Duffel in the offer
            const offerPassenger = offer?.rawOffer?.passengers?.[i];

            const countryCode = p.phoneCountryCode?.replace("+", "") || "234";
            const cleanPhone = p.phone?.replace(/[\s-()]/g, "") || "";

            let formattedPhone = cleanPhone;
            if (!formattedPhone.startsWith("+")) {
              // If it starts with the country code already, just prepends +
              if (formattedPhone.startsWith(countryCode)) {
                formattedPhone = "+" + formattedPhone;
              } else if (formattedPhone.startsWith("0")) {
                formattedPhone =
                  "+" + countryCode + formattedPhone.substring(1);
              } else {
                formattedPhone = "+" + countryCode + formattedPhone;
              }
            }

            return {
              id: offerPassenger?.id || `pas_${i}`,
              title: (p.title || "mr").toLowerCase(),
              gender:
                (p.gender?.charAt(0) || "m").toLowerCase() === "m" ? "m" : "f",
              given_name: p.firstName,
              family_name: p.lastName,
              born_on: p.dateOfBirth,
              email: p.email,
              phone_number: formattedPhone,
            };
          }),
          payments: [
            {
              type: "balance",
              currency: offerDetails.currency,
              amount: String(offerDetails.price),
            },
          ],
        },
      };

      this.logger.log(
        `Duffel Booking Request Payload: ${JSON.stringify(requestBody)}`,
      );

      const response = await fetch(`${this.baseUrl}/air/orders`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(130000),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Duffel booking failed: ${response.status} ${errorBody}`,
        );
        throw new Error(`Duffel booking failed: ${response.status}`);
      }

      const data = await response.json();
      const order = data.data;

      return {
        pnr: order.booking_reference || order.id,
        orderId: order.id,
        ticketNumbers:
          order.documents?.map((d: any) => d.unique_identifier) || [],
      };
    } catch (error) {
      this.logger.error(`Duffel booking error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cancel a booking via Duffel Order Cancellations API
   */
  async cancelBooking(
    orderId: string,
  ): Promise<{ success: boolean; refundAmount?: number }> {
    this.logger.log(`Cancelling Duffel order ${orderId}`);

    try {
      // First create a cancellation quote
      const quoteResponse = await fetch(
        `${this.baseUrl}/air/order_cancellations`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            data: { order_id: orderId },
          }),
          signal: AbortSignal.timeout(30000),
        },
      );

      if (!quoteResponse.ok) {
        throw new Error(
          `Duffel cancellation quote failed: ${quoteResponse.status}`,
        );
      }

      const quoteData = await quoteResponse.json();
      const cancellation = quoteData.data;

      // Confirm the cancellation
      const confirmResponse = await fetch(
        `${this.baseUrl}/air/order_cancellations/${cancellation.id}/actions/confirm`,
        {
          method: "POST",
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(30000),
        },
      );

      if (!confirmResponse.ok) {
        throw new Error(
          `Duffel cancellation confirm failed: ${confirmResponse.status}`,
        );
      }

      return {
        success: true,
        refundAmount: cancellation.refund_amount
          ? parseFloat(cancellation.refund_amount)
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Duffel cancel error: ${error.message}`, error.stack);
      return { success: false };
    }
  }
}
