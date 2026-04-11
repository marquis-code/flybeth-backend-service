// src/modules/integrations/providers/hotelbeds.provider.ts
import { Injectable, Logger } from "@nestjs/common";
import {
  StaysAdapter,
  StaysSearchQuery,
  StaysSearchResult,
  StaysRoomResult,
  StaysBookingResult,
} from "../interfaces/stays-adapter.interface";
import { HotelbedsHelperService } from "./hotelbeds-helper.service";

@Injectable()
export class HotelbedsProvider implements StaysAdapter {
  readonly providerName = "hotelbeds";
  private readonly logger = new Logger(HotelbedsProvider.name);

  constructor(private helper: HotelbedsHelperService) {}

  async searchStays(query: StaysSearchQuery): Promise<StaysSearchResult[]> {
    this.logger.log(
      `Searching HotelBeds Stays near [${query.location?.latitude}, ${query.location?.longitude}]`,
    );

    try {
      const adults = query.guests.filter((g) => g.type === "adult").length || 1;
      const children =
        query.guests.filter((g) => g.type === "child").length || 0;
      const paxes = query.guests
        .filter((g) => g.type === "child")
        .map((g) => ({ type: "CH", age: g.age || 7 }));

      const body = {
        stay: {
          checkIn: query.checkInDate,
          checkOut: query.checkOutDate,
        },
        occupancies: [
          {
            rooms: query.rooms || 1,
            adults: adults,
            children: children,
            paxes: paxes.length > 0 ? paxes : undefined,
          },
        ],
        geolocation: query.location?.latitude
          ? {
              latitude: query.location.latitude,
              longitude: query.location.longitude,
              radius: query.location.radius || 20,
              unit: "km",
            }
          : undefined,
      };

      const response = await fetch(
        `${this.helper.baseUrl}/hotel-api/1.0/hotels`,
        {
          method: "POST",
          headers: this.helper.getHeadersFor("hotel"),
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(
          `HotelBeds search failed: ${response.status} ${errText}`,
        );
        return [];
      }

      const data = await response.json();
      return this.mapSearchResults(data, query);
    } catch (error) {
      this.logger.error(`HotelBeds search error: ${error.message}`);
      return [];
    }
  }

  async getAccommodationDetails(
    accommodationId: string,
  ): Promise<Partial<StaysSearchResult>> {
    this.logger.log(`Fetching HotelBeds details for: ${accommodationId}`);
    try {
      if (accommodationId.startsWith("mock-")) {
        return {
          name: "Premium Mock Hotelbeds Resort",
          description:
            "This is a premium fallback accommodation since we are using a mock ID.",
          photos: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800",
          ],
          location: {
            latitude: 0,
            longitude: 0,
            city: "Mock City",
            address: "123 Mock Avenue",
            countryCode: "US",
          },
          rating: 5,
        };
      }

      const response = await fetch(
        `${this.helper.baseUrl}/hotel-content-api/1.0/hotels/${accommodationId}?language=ENG`,
        {
          headers: this.helper.getHeadersFor("hotel"),
        },
      );

      if (!response.ok) return {};
      const data = await response.json();
      const hotel = data.hotel;

      return {
        name: hotel.name?.content || hotel.name,
        description: hotel.description?.content || "",
        photos:
          hotel.images
            ?.map((img: any) => `http://photos.hotelbeds.com/giata/${img.path}`)
            .slice(0, 10) || [],
        location: {
          latitude: hotel.coordinates?.latitude,
          longitude: hotel.coordinates?.longitude,
          city: hotel.city?.content || "",
          address: hotel.address?.content || "",
          countryCode: hotel.countryCode || "",
        },
        rating: hotel.categoryCode?.charAt(0) || undefined,
      };
    } catch (error) {
      this.logger.error(`HotelBeds getDetails error: ${error.message}`);
      return {};
    }
  }

  async fetchRates(
    searchResultId: string,
    query?: Partial<StaysSearchQuery>,
  ): Promise<StaysRoomResult[]> {
    this.logger.log(`Fetching HotelBeds rates for: ${searchResultId}`);

    // searchResultId format might be: code|checkIn|checkOut|adults|children|childAges
    // or just 'code' if accessing from straight URL.
    let code, checkIn, checkOut, adults, children, childAges;

    if (searchResultId.includes("|")) {
      [code, checkIn, checkOut, adults, children, childAges] =
        searchResultId.split("|");
    } else {
      code = searchResultId;
      checkIn = query?.checkInDate;
      checkOut = query?.checkOutDate;

      let numAdults = 2;
      let numChildren = 0;

      if (query?.guests && query.guests.length > 0) {
        numAdults =
          query.guests.filter((g: any) => g.type === "adult").length || 1;
        numChildren =
          query.guests.filter((g: any) => g.type === "child").length || 0;
        childAges = query.guests
          .filter((g: any) => g.type === "child")
          .map((g: any) => g.age || 7)
          .join(",");
      }

      adults = String(numAdults);
      children = String(numChildren);
    }

    try {
      if (code.startsWith("mock-")) {
        this.logger.warn(
          `Returning mock rates for Hotelbeds due to mock ID: ${code}`,
        );
        return [
          {
            roomId: `${code}-room-1`,
            name: "Standard Double Room",
            photos: [],
            beds: [],
            rates: [
              {
                rateId: `${code}-rate-1`,
                price: 150.0,
                priceWithCommission: 150.0,
                currency: "USD",
                boardType: "RO",
                conditions: [
                  {
                    title: "Non-refundable",
                    description: "Standard non-refundable rate",
                  },
                ],
              },
            ],
          },
        ] as any;
      }

      const paxes = childAges
        ? childAges
            .split(",")
            .map((age: any) => ({ type: "CH", age: parseInt(age) }))
        : [];
      const body = {
        stay: { checkIn, checkOut },
        occupancies: [
          {
            rooms: 1,
            adults: parseInt(adults),
            children: parseInt(children),
            paxes: paxes.length > 0 ? paxes : undefined,
          },
        ],
        hotels: {
          hotel: [parseInt(code)],
        },
      };

      const response = await fetch(
        `${this.helper.baseUrl}/hotel-api/1.0/hotels`,
        {
          method: "POST",
          headers: this.helper.getHeadersFor("hotel"),
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) return [];
      const data = await response.json();
      const hotel = data.hotels?.hotels?.[0];

      if (!hotel || !hotel.rooms) return [];

      return hotel.rooms.map((room: any) => ({
        roomId: room.code,
        name: room.name,
        rates: room.rates.map((rate: any) => ({
          rateId: rate.rateKey,
          name: rate.boardName || "Standard Rate",
          price: parseFloat(rate.net),
          currency: data.hotels.currency || "USD",
          boardType: rate.boardCode,
          conditions:
            rate.cancellationPolicies?.map((cp: any) => ({
              title: `Cancellation from ${cp.from}`,
              description: `Charge: ${cp.amount} ${data.hotels.currency || "USD"}`,
            })) || [],
        })),
      }));
    } catch (error) {
      this.logger.error(`HotelBeds fetchRates error: ${error.message}`);
      return [];
    }
  }

  async createQuote(rateId: string): Promise<any> {
    this.logger.log(`Creating HotelBeds quote for rateKey: ${rateId}`);
    try {
      if (rateId.startsWith("mock-")) {
        return {
          quoteId: `${rateId}-quote`,
          hotelName: "Premium Mock Hotelbeds Resort",
          roomName: "Standard Double Room",
          price: 150.0,
          currency: "USD",
          rateType: "RECHECK",
          raw: {},
        };
      }

      const response = await fetch(
        `${this.helper.baseUrl}/hotel-api/1.0/checkrates`,
        {
          method: "POST",
          headers: this.helper.getHeadersFor("hotel"),
          body: JSON.stringify({
            rooms: [{ rateKey: rateId }],
          }),
        },
      );

      if (!response.ok)
        throw new Error(`HotelBeds checkrates failed: ${response.status}`);
      const data = await response.json();
      const hotel = data.hotel;
      const rate = hotel.rooms?.[0]?.rates?.[0];

      if (!rate) throw new Error("No rate found in checkrates response");

      return {
        quoteId: rate.rateKey,
        hotelName: hotel.name,
        roomName: hotel.rooms[0].name,
        price: parseFloat(rate.net),
        currency: data.currency || "USD",
        rateType: rate.rateType,
        cancellationPolicies: rate.cancellationPolicies,
        raw: data,
      };
    } catch (error) {
      this.logger.error(`HotelBeds createQuote error: ${error.message}`);
      throw error;
    }
  }

  async createBooking(
    quoteId: string,
    guestDetails: any,
  ): Promise<StaysBookingResult> {
    this.logger.log(`Creating HotelBeds booking for rateKey: ${quoteId}`);

    try {
      if (quoteId.startsWith("mock-")) {
        return {
          bookingId: `MOCKHB-${Date.now()}`,
          reference: `FLYBETH-${Date.now()}`,
          status: "CONFIRMED",
          accommodationName: "Premium Mock Hotelbeds Resort",
          checkInDate: new Date().toISOString().split("T")[0],
          checkOutDate: new Date(Date.now() + 86400000)
            .toISOString()
            .split("T")[0],
          confirmedAt: new Date().toISOString(),
        };
      }

      const primaryGuest = guestDetails.guests?.[0] || guestDetails;

      const paxes = guestDetails.guests?.map((guest: any) => ({
        roomId: 1,
        type: guest.type || "AD",
        name: guest.firstName || primaryGuest.firstName || "Guest",
        surname: guest.lastName || primaryGuest.lastName || "User",
      })) || [
        {
          roomId: 1,
          type: "AD",
          name: primaryGuest.firstName || "Guest",
          surname: primaryGuest.lastName || "User",
        },
      ];

      const body: any = {
        holder: {
          name: primaryGuest.firstName || "Guest",
          surname: primaryGuest.lastName || "User",
        },
        rooms: [
          {
            rateKey: quoteId,
            paxes: paxes,
          },
        ],
        clientReference: `FLYBETH-${Date.now()}`,
        remark: "Booking from Flybeth Platform",
        tolerance: 2,
      };

      if (guestDetails.paymentData) {
        body.paymentData = guestDetails.paymentData;
      }

      const response = await fetch(
        `${this.helper.baseUrl}/hotel-api/1.0/bookings`,
        {
          method: "POST",
          headers: this.helper.getHeadersFor("hotel"),
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `HotelBeds booking failed: ${response.status} ${errorText}`,
        );
        throw new Error(`HotelBeds booking failed: ${response.status}`);
      }

      const data = await response.json();
      const booking = data.booking;

      return {
        bookingId: booking.reference,
        reference: booking.clientReference,
        status: booking.status === "CONFIRMED" ? "CONFIRMED" : "PENDING",
        accommodationName: booking.hotel.name,
        checkInDate: booking.hotel.checkIn,
        checkOutDate: booking.hotel.checkOut,
        confirmedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Hotelbeds booking error: ${error.message}`);
      throw error;
    }
  }

  async cancelBooking(bookingId: string): Promise<any> {
    this.logger.log(`Cancelling HotelBeds booking: ${bookingId}`);

    try {
      const response = await fetch(
        `${this.helper.baseUrl}/hotel-api/1.0/bookings/${bookingId}?cancellationFlag=CANCELLATION`,
        {
          method: "DELETE",
          headers: this.helper.getHeadersFor("hotel"),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `HotelBeds cancellation failed: ${response.status} ${errorText}`,
        );
        return { status: "FAILED", message: errorText };
      }

      const data = await response.json();
      return {
        status: "CANCELLED",
        reference: data.booking?.reference,
        cancellationReference: data.booking?.cancellationReference,
      };
    } catch (error) {
      this.logger.error(`HotelBeds cancellation error: ${error.message}`);
      return { status: "ERROR", message: error.message };
    }
  }

  private mapSearchResults(
    data: any,
    query: StaysSearchQuery,
  ): StaysSearchResult[] {
    if (!data.hotels || !data.hotels.hotels) return [];

    const adults = query.guests.filter((g) => g.type === "adult").length || 1;
    const children = query.guests.filter((g) => g.type === "child").length || 0;
    const childAges = query.guests
      .filter((g) => g.type === "child")
      .map((g) => g.age || 7)
      .join(",");

    return data.hotels.hotels.map((h: any) => {
      // Encode context into searchResultId for fetchRates
      const searchResultId = `${h.code}|${query.checkInDate}|${query.checkOutDate}|${adults}|${children}|${childAges}`;

      return {
        provider: this.providerName,
        accommodationId: String(h.code),
        searchResultId: searchResultId,
        name: h.name,
        cheapestPrice: parseFloat(h.minRate || "0"),
        priceWithCommission: parseFloat(h.minRate || "0"),
        currency: data.hotels.currency || h.currency || "USD",
        photos: [],
        location: {
          latitude: parseFloat(h.latitude),
          longitude: parseFloat(h.longitude),
          address: "",
          city: h.destinationName || "",
          countryCode: "",
        },
        amenities: [],
        checkInDate: query.checkInDate,
        checkOutDate: query.checkOutDate,
      };
    });
  }
}
