import { Injectable, Logger } from "@nestjs/common";
import {
  AirlineAdapter,
  FlightSearchQuery,
  FlightSearchResult,
  FlightSegment,
} from "../interfaces/airline-adapter.interface";
import { AmadeusHelperService } from "./amadeus-helper.service";

@Injectable()
export class AmadeusProvider implements AirlineAdapter {
  readonly providerName = "amadeus";
  private readonly logger = new Logger(AmadeusProvider.name);

  constructor(private amadeusHelper: AmadeusHelperService) {}

  /**
   * Search flights using Amadeus Flight Offers Search API
   */
  async searchFlights(query: FlightSearchQuery): Promise<FlightSearchResult[]> {
    this.logger.log(
      `Searching Amadeus: ${query.origin} -> ${query.destination} on ${query.departureDate}`,
    );

    try {
      const token = await this.amadeusHelper.getAccessToken();

      // Build query params for GET request
      const params = new URLSearchParams({
        originLocationCode: query.origin.toUpperCase(),
        destinationLocationCode: query.destination.toUpperCase(),
        departureDate: query.departureDate,
        adults: String(query.adults || 1),
        currencyCode: "USD",
        max: "50",
      });

      if (query.returnDate) {
        params.set("returnDate", query.returnDate);
      }
      if (query.children) {
        params.set("children", String(query.children));
      }
      if (query.infants) {
        params.set("infants", String(query.infants));
      }
      if (query.class) {
        const cabinMap: Record<string, string> = {
          economy: "ECONOMY",
          premium_economy: "PREMIUM_ECONOMY",
          business: "BUSINESS",
          first: "FIRST",
        };
        params.set("travelClass", cabinMap[query.class] || "ECONOMY");
      }
      if (query.maxConnections !== undefined) {
        params.set("nonStop", query.maxConnections === 0 ? "true" : "false");
      }

      const response = await fetch(
        `${this.amadeusHelper.baseUrl}/v2/shopping/flight-offers?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(30000),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Amadeus search failed: ${response.status} ${errorBody}`,
        );
        return [];
      }

      const data = await response.json();
      return this.mapAmadeusResults(data, query);
    } catch (error) {
      this.logger.error(`Amadeus search error: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Map Amadeus response to our unified format
   */
  private mapAmadeusResults(
    data: any,
    query: FlightSearchQuery,
  ): FlightSearchResult[] {
    if (!data?.data || !Array.isArray(data.data)) {
      return [];
    }

    const dictionaries = data.dictionaries || {};
    const carriers = dictionaries.carriers || {};

    return data.data.map((offer: any) => {
      const itinerary = offer.itineraries?.[0];
      const segments: FlightSegment[] = (itinerary?.segments || []).map(
        (seg: any) => ({
          flightNumber: `${seg.carrierCode}${seg.number}`,
          airline: carriers[seg.carrierCode] || seg.carrierCode,
          origin: seg.departure?.iataCode,
          destination: seg.arrival?.iataCode,
          originTerminal: seg.departure?.terminal,
          destinationTerminal: seg.arrival?.terminal,
          departureTime: seg.departure?.at,
          arrivalTime: seg.arrival?.at,
          duration: this.amadeusHelper.parseDuration(seg.duration),
          aircraft:
            dictionaries.aircraft?.[seg.aircraft?.code] || seg.aircraft?.code,
          operatingCarrier: seg.operating?.carrierCode
            ? carriers[seg.operating.carrierCode] || seg.operating.carrierCode
            : undefined,
          marketingCarrier: carriers[seg.carrierCode] || seg.carrierCode,
        }),
      );

      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];
      const price = parseFloat(offer.price?.total || "0");

      // Get cabin class from first traveler's fare detail
      const cabinClass =
        offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ||
        "ECONOMY";

      return {
        provider: "amadeus",
        offerId: offer.id,
        airline: firstSegment?.airline || "Unknown",
        flightNumbers: segments.map((s) => s.flightNumber),
        origin: firstSegment?.origin || query.origin,
        destination: lastSegment?.destination || query.destination,
        departureTime: firstSegment?.departureTime,
        arrivalTime: lastSegment?.arrivalTime,
        duration: this.amadeusHelper.parseDuration(itinerary?.duration),
        price,
        priceWithCommission: price, // Will be set by integration service
        currency: offer.price?.currency || "USD",
        seatsAvailable: offer.numberOfBookableSeats,
        stops: segments.length - 1,
        segments,
        cabinClass: cabinClass.toLowerCase(),
        expiresAt: offer.lastTicketingDate,
        conditions: {
          refundable: offer.pricingOptions?.refundableFares === true,
          changeable: true,
        },
        baggageIncluded: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]
          ?.includedCheckedBags?.weight
          ? `${offer.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags.weight}${offer.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags.weightUnit}`
          : undefined,
        rawOffer: offer,
      } as FlightSearchResult;
    });
  }

  /**
   * Price a flight offer using Amadeus Flight Offers Pricing API
   */
  async priceOffer(offer: any, retryCount = 0): Promise<any> {
    this.logger.log(`Pricing flight offer: ${offer.offerId || offer.id}`);

    try {
      const token = await this.amadeusHelper.getAccessToken();

      const priceUrl = `${this.amadeusHelper.baseUrl}/v1/shopping/flight-offers/pricing`;

      // Resolve the raw Amadeus offer from our unified format
      let resolvedOffer: any;
      if (offer.rawOffer) {
        resolvedOffer = offer.rawOffer;
        this.logger.log("Resolved offer from: rawOffer");
      } else if (offer.raw) {
        resolvedOffer = offer.raw;
        this.logger.log("Resolved offer from: raw");
      } else if (offer.itineraries) {
        resolvedOffer = offer;
        this.logger.log("Resolved offer from: direct offer (has itineraries)");
      } else {
        resolvedOffer = offer;
        this.logger.warn(
          "Could not resolve a known offer format — sending as-is",
        );
      }

      // Strip amenities from travelerPricings to reduce payload size
      // (Amadeus doesn't need them for pricing and they can cause issues)
      if (resolvedOffer.travelerPricings) {
        resolvedOffer = {
          ...resolvedOffer,
          travelerPricings: resolvedOffer.travelerPricings.map((tp: any) => ({
            ...tp,
            fareDetailsBySegment: tp.fareDetailsBySegment?.map((fd: any) => {
              const { amenities, ...rest } = fd;
              return rest;
            }),
          })),
        };
      }

      const pricingPayload = {
        data: {
          type: "flight-offers-pricing",
          flightOffers: [resolvedOffer],
        },
      };
      this.logger.warn(
        `===== AMADEUS PRICING REQUEST (attempt ${retryCount + 1}) =====`,
      );
      this.logger.warn(`URL: ${priceUrl}`);
      this.logger.warn(`PAYLOAD: ${JSON.stringify(pricingPayload, null, 2)}`);
      this.logger.warn(`===================================`);
      const response = await fetch(priceUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(pricingPayload),
        signal: AbortSignal.timeout(90000),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Amadeus pricing failed: ${response.status} ${errorBody}`,
        );

        // Retry once on 500 (transient Amadeus internal errors)
        if (response.status === 500 && retryCount < 1) {
          this.logger.warn(
            "Retrying pricing in 2 seconds (transient 500 error)...",
          );
          await new Promise((r) => setTimeout(r, 2000));
          return this.priceOffer(offer, retryCount + 1);
        }

        throw new Error(`Amadeus pricing failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Amadeus pricing error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get seatmap for a flight offer using Amadeus Seatmap Display API
   */
  async getSeatmap(flightOffer: any): Promise<any> {
    this.logger.log(`Fetching seatmap for flight offer: ${flightOffer.id}`);

    try {
      const token = await this.amadeusHelper.getAccessToken();

      const response = await fetch(
        `${this.amadeusHelper.baseUrl}/v1/shopping/seatmaps`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            data: [flightOffer],
          }),
          signal: AbortSignal.timeout(90000),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Amadeus seatmap failed: ${response.status} ${errorBody}`,
        );
        throw new Error(`Amadeus seatmap failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Amadeus seatmap error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Book a flight via Amadeus
   */
  async bookFlight(
    offerId: string,
    passengers: any[],
    payment?: any,
    offer?: any,
  ): Promise<{ pnr: string; orderId: string; ticketNumbers?: string[] }> {
    this.logger.log(
      `Booking flight ${offerId} on Amadeus for ${passengers.length} passengers`,
    );

    try {
      const token = await this.amadeusHelper.getAccessToken();

      // First re-price the offer
      const priceData = await this.priceOffer(offer || { id: offerId });
      const pricedOffer = priceData.data?.flightOffers?.[0];

      if (!pricedOffer) {
        throw new Error("No priced offer returned from Amadeus");
      }

      // Create the order
      const bookingUrl = `${this.amadeusHelper.baseUrl}/v1/booking/flight-orders`;
      const bookingPayload = {
        data: {
          type: "flight-order",
          flightOffers: [pricedOffer],
          travelers: passengers.map((p, i) => {
            const cleanPhone = p.phone.replace(/\D/g, "");
            return {
              id: String(i + 1),
              dateOfBirth: p.dateOfBirth,
              name: {
                firstName: p.firstName.toUpperCase(),
                lastName: p.lastName.toUpperCase(),
              },
              gender: p.gender?.toUpperCase() || "MALE",
              contact: {
                emailAddress: p.email,
                phones: [
                  {
                    deviceType: "MOBILE",
                    countryCallingCode: p.phoneCountryCode || "1",
                    number: cleanPhone,
                  },
                ],
              },
              documents: p.passportNumber
                ? [
                    {
                      documentType: "PASSPORT",
                      number: p.passportNumber,
                      expiryDate: p.passportExpiry,
                      issuanceCountry: p.passportCountry || "US",
                      nationality: p.nationality || "US",
                      holder: true,
                    },
                  ]
                : undefined,
            };
          }),
          remarks: {
            general: [
              {
                subType: "GENERAL_MISCELLANEOUS",
                text: "ONLINE BOOKING",
              },
            ],
          },
          ticketingAgreement: {
            option: "DELAY_TO_CANCEL",
            delay: "6D",
          },
          contacts: [
            {
              addresseeName: {
                firstName: passengers[0].firstName.toUpperCase(),
                lastName: passengers[0].lastName.toUpperCase(),
              },
              purpose: "STANDARD",
              phones: [
                {
                  deviceType: "MOBILE",
                  countryCallingCode: passengers[0].phoneCountryCode || "1",
                  number: passengers[0].phone.replace(/\D/g, ""),
                },
              ],
              emailAddress: passengers[0].email,
              address: {
                lines: ["Main Street, 123"],
                postalCode: "10001",
                cityName: "Lagos",
                countryCode: passengers[0].passportCountry || "NG",
              },
            },
          ],
        },
      };
      this.logger.warn(`===== AMADEUS BOOKING REQUEST =====`);
      this.logger.warn(`URL: ${bookingUrl}`);
      this.logger.warn(`PAYLOAD: ${JSON.stringify(bookingPayload, null, 2)}`);
      this.logger.warn(`===================================`);
      const orderResponse = await fetch(bookingUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(bookingPayload),
        signal: AbortSignal.timeout(90000),
      });

      if (!orderResponse.ok) {
        const errBody = await orderResponse.text();
        throw new Error(
          `Amadeus booking failed: ${orderResponse.status} ${errBody}`,
        );
      }

      const orderData = await orderResponse.json();
      const order = orderData.data;

      return {
        pnr: order.associatedRecords?.[0]?.reference || order.id,
        orderId: order.id,
        ticketNumbers:
          order.flightOffers?.[0]?.travelerPricings?.map(
            (tp: any) => tp.fareDetailsBySegment?.[0]?.fareBasis,
          ) || [],
      };
    } catch (error) {
      this.logger.error(`Amadeus booking error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cancel a booking via Amadeus
   */
  async cancelBooking(
    orderId: string,
  ): Promise<{ success: boolean; refundAmount?: number }> {
    this.logger.log(`Cancelling Amadeus booking ${orderId}`);
    try {
      const token = await this.amadeusHelper.getAccessToken();
      const response = await fetch(
        `${this.amadeusHelper.baseUrl}/v1/booking/flight-orders/${orderId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(30000),
        },
      );

      return { success: response.ok };
    } catch (error) {
      this.logger.error(`Amadeus cancel error: ${error.message}`, error.stack);
      return { success: false };
    }
  }

  /**
   * Search for locations (cities/airports) by keyword
   */
  async searchLocations(keyword: string, countryCode?: string): Promise<any[]> {
    this.logger.log(`Searching Amadeus locations for keyword: ${keyword}`);
    try {
      const token = await this.amadeusHelper.getAccessToken();
      const params = new URLSearchParams({
        subType: "CITY,AIRPORT",
        keyword,
      });
      if (countryCode) params.set("countryCode", countryCode.toUpperCase());

      const response = await fetch(
        `${this.amadeusHelper.baseUrl}/v1/reference-data/locations?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Amadeus location search failed: ${response.status} ${errorBody}`,
        );
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      this.logger.error(`Amadeus location search error: ${error.message}`);
      return [];
    }
  }

  /**
   * Find nearest airports for a given set of coordinates
   */
  async getNearestAirports(
    latitude: number,
    longitude: number,
  ): Promise<any[]> {
    this.logger.log(
      `Searching Amadeus nearest airports for: ${latitude}, ${longitude}`,
    );
    try {
      const token = await this.amadeusHelper.getAccessToken();
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
      });

      const response = await fetch(
        `${this.amadeusHelper.baseUrl}/v1/reference-data/locations/airports?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Amadeus nearest airports search failed: ${response.status} ${errorBody}`,
        );
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      this.logger.error(
        `Amadeus nearest airports search error: ${error.message}`,
      );
      return [];
    }
  }
}
