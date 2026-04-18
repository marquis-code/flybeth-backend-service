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
      "Duffel-Version": "v1",
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

      if (query.customerId) {
        requestBody.data.customer_id = query.customerId;
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
   * Create a customer record in Duffel Identity
   */
  async createCustomer(userData: any): Promise<any> {
    this.logger.log(`Creating Duffel identity customer for ${userData.email}`);
    try {
      const response = await fetch(`${this.baseUrl}/identity/customer_users`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          data: {
            email: userData.email,
            given_name: userData.firstName,
            family_name: userData.lastName,
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Duffel identity customer creation failed (${response.status}): ${errorBody}`);
        return null;
      }

      const data = await response.json();
      this.logger.log(`Successfully created/fetched Duffel customer: ${data.data?.id}`);
      return data.data;
    } catch (error) {
      this.logger.error(`Duffel create identity customer error: ${error.message}`);
      return null;
    }
  }

  /**
   * Create a component client key for an identity customer
   */
  async createClientKey(customerId: string): Promise<any> {
    this.logger.log(`Creating Duffel component client key for customer ${customerId}`);
    try {
      const response = await fetch(`${this.baseUrl}/identity/component_client_keys`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          data: { 
            customer_user_id: customerId 
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Duffel client key creation failed: ${error}`);
        return null;
      }

      const data = await response.json();
      const clientKey = data.data?.client_key || data.data?.component_client_key;
      
      if (!clientKey) {
        this.logger.warn(`Duffel response did not contain a client key: ${JSON.stringify(data)}`);
      }

      return { 
        client_key: clientKey 
      };
    } catch (error) {
      this.logger.error(`Duffel create client key error: ${error.message}`);
      return null;
    }
  }

  /**
   * Create a card in Duffel's PCI vault
   */
  async createCard(cardData: any): Promise<any> {
    this.logger.log(`Creating Duffel card for ${cardData.name}`);
    try {
      const response = await fetch("https://api.duffel.cards/payments/cards", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ data: cardData }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Duffel card creation failed: ${error}`);
        throw new Error(`Card creation failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      this.logger.error(`Duffel create card error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a 3DS session for a simplified or corporate payment
   */
  async create3DSSession(sessionData: any): Promise<any> {
    this.logger.log(`Creating Duffel 3DS session for card ${sessionData.card_id}`);
    try {
      const response = await fetch(`${this.baseUrl}/payments/three_d_secure_sessions`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ data: sessionData }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Duffel 3DS session failed: ${error}`);
        throw new Error(`3DS session failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      this.logger.error(`Duffel create 3DS session error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a hold order (Reserve now, pay later)
   */
  async createHoldOrder(
    offerId: string,
    passengers: any[],
  ): Promise<{ pnr: string; orderId: string; expiresAt: string }> {
    this.logger.log(`Creating Duffel hold order ${offerId}`);
    try {
      const requestBody = {
        data: {
          type: "hold",
          selected_offers: [offerId],
          passengers: this.mapPassengersForBooking(passengers),
        },
      };

      const response = await fetch(`${this.baseUrl}/air/orders`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Duffel hold order failed: ${error}`);
        throw new Error(`Hold order failed: ${response.status}`);
      }

      const data = await response.json();
      const order = data.data;

      return {
        pnr: order.booking_reference || order.id,
        orderId: order.id,
        expiresAt: order.payment_required_by,
      };
    } catch (error) {
      this.logger.error(`Duffel create hold order error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Pay for a previously created hold order
   */
  async payForOrder(
    orderId: string,
    payment: any,
  ): Promise<{ success: boolean; ticketNumbers?: string[] }> {
    this.logger.log(`Paying for Duffel order ${orderId}`);
    try {
      const response = await fetch(`${this.baseUrl}/air/orders/${orderId}/actions/pay`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          data: {
            payment: {
              type: payment.type || "balance",
              currency: payment.currency,
              amount: String(payment.amount),
              ...(payment.cardId ? { card_id: payment.cardId } : {}),
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Duffel payment failed: ${error}`);
        return { success: false };
      }

      const data = await response.json();
      return {
        success: true,
        ticketNumbers: data.data.documents?.map((d: any) => d.unique_identifier) || [],
      };
    } catch (error) {
      this.logger.error(`Duffel pay order error: ${error.message}`);
      return { success: false };
    }
  }

  /**
   * Internal helper to map our passenger format to Duffel's booking format
   */
  private mapPassengersForBooking(passengers: any[]): any[] {
    return passengers.map((p, i) => {
      const countryCode = p.phoneCountryCode?.replace("+", "") || "234";
      const cleanPhone = p.phone?.replace(/[\s-()]/g, "") || "";

      let formattedPhone = cleanPhone;
      if (!formattedPhone.startsWith("+")) {
        if (formattedPhone.startsWith(countryCode)) {
          formattedPhone = "+" + formattedPhone;
        } else if (formattedPhone.startsWith("0")) {
          formattedPhone = "+" + countryCode + formattedPhone.substring(1);
        } else {
          formattedPhone = "+" + countryCode + formattedPhone;
        }
      }

      return {
        id: p.duffelPassengerId || `pas_${i}`, // fallback if not provided
        title: (p.title || "mr").toLowerCase(),
        gender: (p.gender?.charAt(0) || "m").toLowerCase() === "m" ? "m" : "f",
        given_name: p.firstName,
        family_name: p.lastName,
        born_on: p.dateOfBirth,
        email: p.email,
        phone_number: formattedPhone,
      };
    });
  }

  /**
   * Book a flight via Duffel Orders API (Instant)
   */
  async bookFlight(
    offerId: string,
    passengers: any[],
    payment?: any,
    offer?: any,
  ): Promise<{ pnr: string; orderId: string; ticketNumbers?: string[] }> {
    this.logger.log(`Booking Duffel flight ${offerId}`);

    try {
      const requestBody: any = {
        data: {
          type: "instant",
          selected_offers: [offerId],
          passengers: this.mapPassengersForBooking(passengers),
          payments: [
            {
              type: payment?.type || "balance",
              currency: payment?.currency || offer?.currency || "USD",
              amount: String(payment?.amount || offer?.price || "0"),
              ...(payment?.cardId ? { card_id: payment.cardId } : {}),
            },
          ],
        },
      };

      const response = await fetch(`${this.baseUrl}/air/orders`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(130000),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Duffel booking failed: ${response.status} ${errorBody}`);
        throw new Error(`Duffel booking failed: ${response.status}`);
      }

      const data = await response.json();
      const order = data.data;

      return {
        pnr: order.booking_reference || order.id,
        orderId: order.id,
        ticketNumbers: order.documents?.map((d: any) => d.unique_identifier) || [],
      };
    } catch (error) {
      this.logger.error(`Duffel booking error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel a booking via Duffel Order Cancellations API
   */
  async cancelBooking(orderId: string): Promise<{ success: boolean; refundAmount?: number }> {
    this.logger.log(`Cancelling Duffel order ${orderId}`);
    try {
      const quoteResponse = await fetch(`${this.baseUrl}/air/order_cancellations`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ data: { order_id: orderId } }),
      });

      if (!quoteResponse.ok) return { success: false };
      const quoteData = await quoteResponse.json();
      const cancellation = quoteData.data;

      const confirmResponse = await fetch(
        `${this.baseUrl}/air/order_cancellations/${cancellation.id}/actions/confirm`,
        { method: "POST", headers: this.getHeaders() },
      );

      return {
        success: confirmResponse.ok,
        refundAmount: cancellation.refund_amount ? parseFloat(cancellation.refund_amount) : undefined,
      };
    } catch (error) {
      this.logger.error(`Duffel cancel error: ${error.message}`);
      return { success: false };
    }
  }
}

