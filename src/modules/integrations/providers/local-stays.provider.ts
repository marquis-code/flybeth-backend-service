// src/modules/integrations/providers/local-stays.provider.ts
//
// Platform-owned ("flybeth") hotel inventory.
//
// This adapter exposes the Stay/Room collections through the exact same
// StaysAdapter contract as the live providers, so the search, rates, quote,
// booking and payment funnel is identical no matter who supplies the room.
//
// It is the reliable backbone for stays: when Duffel Stays is not enabled on
// the account, Amadeus is unavailable, or Hotelbeds credentials are missing,
// the platform still sells its own contracted rooms.

import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  StaysAdapter,
  StaysSearchQuery,
  StaysSearchResult,
  StaysRoomResult,
  StaysBookingResult,
} from "../interfaces/stays-adapter.interface";
import { Stay, StayDocument } from "../../stays/schemas/stay.schema";
import { Room, RoomDocument } from "../../stays/schemas/room.schema";

/** Delimiter used inside the opaque ids this adapter hands back to the client. */
const SEP = "~";

export const LOCAL_STAYS_PROVIDER = "flybeth";

@Injectable()
export class LocalStaysProvider implements StaysAdapter {
  readonly providerName = LOCAL_STAYS_PROVIDER;
  private readonly logger = new Logger(LocalStaysProvider.name);

  constructor(
    @InjectModel(Stay.name) private stayModel: Model<StayDocument>,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
  ) {}

  // ─── helpers ──────────────────────────────────────────────────────────

  private nightsBetween(checkIn: string, checkOut: string): number {
    const a = new Date(checkIn).getTime();
    const b = new Date(checkOut).getTime();
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 1;
    return Math.max(1, Math.round((b - a) / 86400000));
  }

  private haversineKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  /**
   * searchResultId carries everything needed to re-price the stay later, so the
   * adapter stays stateless (no cache/Redis dependency for correctness).
   */
  private buildSearchResultId(
    stayId: string,
    q: Pick<
      StaysSearchQuery,
      "checkInDate" | "checkOutDate" | "rooms" | "guests"
    >,
  ): string {
    const adults = q.guests?.filter((g) => g.type === "adult").length || 1;
    const children = q.guests?.filter((g) => g.type === "child").length || 0;
    return [
      "fbs",
      stayId,
      q.checkInDate,
      q.checkOutDate,
      String(q.rooms || 1),
      String(adults),
      String(children),
    ].join(SEP);
  }

  private parseSearchResultId(searchResultId: string) {
    const parts = String(searchResultId).split(SEP);
    if (parts.length < 7 || parts[0] !== "fbs") return null;
    return {
      stayId: parts[1],
      checkInDate: parts[2],
      checkOutDate: parts[3],
      rooms: Number(parts[4]) || 1,
      adults: Number(parts[5]) || 1,
      children: Number(parts[6]) || 0,
    };
  }

  private buildRateId(
    roomId: string,
    checkInDate: string,
    checkOutDate: string,
    rooms: number,
    adults: number,
    children: number,
  ): string {
    return [
      "fbr",
      roomId,
      checkInDate,
      checkOutDate,
      String(rooms),
      String(adults),
      String(children),
    ].join(SEP);
  }

  private parseRateId(rateId: string) {
    const parts = String(rateId).split(SEP);
    if (parts.length < 7 || parts[0] !== "fbr") return null;
    return {
      roomId: parts[1],
      checkInDate: parts[2],
      checkOutDate: parts[3],
      rooms: Number(parts[4]) || 1,
      adults: Number(parts[5]) || 1,
      children: Number(parts[6]) || 0,
    };
  }

  private buildQuoteId(
    roomId: string,
    checkInDate: string,
    checkOutDate: string,
    rooms: number,
    adults: number,
    children: number,
  ): string {
    return [
      "fbq",
      roomId,
      checkInDate,
      checkOutDate,
      String(rooms),
      String(adults),
      String(children),
    ].join(SEP);
  }

  private parseQuoteId(quoteId: string) {
    const parts = String(quoteId).split(SEP);
    if (parts.length < 7 || parts[0] !== "fbq") return null;
    return {
      roomId: parts[1],
      checkInDate: parts[2],
      checkOutDate: parts[3],
      rooms: Number(parts[4]) || 1,
      adults: Number(parts[5]) || 1,
      children: Number(parts[6]) || 0,
    };
  }

  private toAmenities(stay: StayDocument) {
    const list = Array.isArray(stay.amenities) ? stay.amenities : [];
    return list.map((a) => ({
      type: String(a).toUpperCase().replace(/\s+/g, "_"),
      description: String(a),
    }));
  }

  private toResult(
    stay: StayDocument,
    nightlyPrice: number,
    query: {
      checkInDate: string;
      checkOutDate: string;
      rooms: number;
      guests: Array<{ type: "adult" | "child"; age?: number }>;
    },
  ): StaysSearchResult {
    const nights = this.nightsBetween(query.checkInDate, query.checkOutDate);
    const rooms = query.rooms || 1;
    const cheapestPrice = Math.round(nightlyPrice * nights * rooms * 100) / 100;
    const coords = stay.location?.coordinates;

    return {
      provider: this.providerName,
      accommodationId: stay._id.toString(),
      name: stay.name,
      description: stay.description,
      photos: stay.images?.length ? stay.images : [],
      rating: stay.rating,
      reviewScore: stay.rating ? stay.rating * 2 : undefined,
      reviewCount: undefined,
      location: {
        latitude: coords?.lat ?? 0,
        longitude: coords?.lng ?? 0,
        address: stay.location?.address || "",
        city: stay.location?.city || "",
        countryCode: stay.location?.country || "",
      },
      cheapestPrice,
      priceWithCommission: cheapestPrice,
      currency: "USD",
      amenities: this.toAmenities(stay),
      checkInDate: query.checkInDate,
      checkOutDate: query.checkOutDate,
      checkInTime: "14:00",
      checkOutTime: "11:00",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      searchResultId: this.buildSearchResultId(stay._id.toString(), query),
      type: stay.type,
      city: stay.location?.city || "",
      country: stay.location?.country || "",
      nights,
      rooms,
    } as StaysSearchResult;
  }

  /** Cheapest bookable nightly rate for a stay (rooms must have stock). */
  private async cheapestNightly(stayId: string): Promise<number | null> {
    const rooms = await this.roomModel
      .find({ stay: new Types.ObjectId(stayId), quantity: { $gt: 0 } })
      .lean()
      .exec();
    if (!rooms.length) return null;
    return Math.min(...rooms.map((r: any) => Number(r.pricePerNight) || 0));
  }

  // ─── StaysAdapter ─────────────────────────────────────────────────────

  async searchStays(query: StaysSearchQuery): Promise<StaysSearchResult[]> {
    const checkIn = query.checkInDate;
    const checkOut = query.checkOutDate;
    if (!checkIn || !checkOut) {
      this.logger.warn("Local stays search skipped: missing dates");
      return [];
    }

    let stays: StayDocument[] = [];

    if (query.accommodationId && Types.ObjectId.isValid(query.accommodationId)) {
      const one = await this.stayModel
        .findById(query.accommodationId)
        .lean()
        .exec();
      stays = one ? [one as unknown as StayDocument] : [];
    } else {
      stays = (await this.stayModel
        .find({ isActive: true })
        .lean()
        .exec()) as unknown as StayDocument[];
    }

    // Location filter: prefer a radius search, fall back to returning everything
    // (the user app already resolves a destination into coordinates).
    if (query.location && query.location.latitude != null) {
      const radius = query.location.radius || 20;
      const near = stays.filter((s) => {
        const c = s.location?.coordinates;
        if (!c || (c.lat === 0 && c.lng === 0)) return false;
        return (
          this.haversineKm(
            query.location!.latitude,
            query.location!.longitude,
            c.lat,
            c.lng,
          ) <= radius
        );
      });
      // Only apply the radius when it actually matches something, otherwise a
      // slightly-off geocode would hide all of our own inventory.
      if (near.length) stays = near;
    }

    const paxPerRoom = Math.max(
      1,
      (query.guests || []).filter((g) => g.type === "adult").length || 1,
    );

    const results: StaysSearchResult[] = [];
    for (const stay of stays) {
      const nightly = await this.cheapestNightly(stay._id.toString());
      if (nightly === null || nightly <= 0) continue;

      const rooms = await this.roomModel
        .find({ stay: stay._id, quantity: { $gt: 0 } })
        .lean()
        .exec();
      const maxCapacity = Math.max(
        ...rooms.map((r: any) => Number(r.capacity) || 0),
        0,
      );
      if (maxCapacity && maxCapacity < paxPerRoom) continue;

      results.push(this.toResult(stay, nightly, query));
    }

    this.logger.log(`Local stays returned ${results.length} results`);
    return results;
  }

  async getAccommodationDetails(
    accommodationId: string,
  ): Promise<Partial<StaysSearchResult>> {
    if (!Types.ObjectId.isValid(accommodationId)) {
      throw new NotFoundException("Stay not found");
    }
    const stay = await this.stayModel.findById(accommodationId).lean().exec();
    if (!stay) throw new NotFoundException("Stay not found");

    const nightly = (await this.cheapestNightly(accommodationId)) || 0;
    return this.toResult(stay as unknown as StayDocument, nightly, {
      checkInDate: new Date().toISOString().split("T")[0],
      checkOutDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      rooms: 1,
      guests: [{ type: "adult" }],
    });
  }

  async fetchRates(
    searchResultId: string,
    query?: Partial<StaysSearchQuery>,
  ): Promise<StaysRoomResult[]> {
    const parsed = this.parseSearchResultId(searchResultId);
    if (!parsed) {
      this.logger.warn(`Unrecognised local searchResultId: ${searchResultId}`);
      return [];
    }

    const checkInDate = query?.checkInDate || parsed.checkInDate;
    const checkOutDate = query?.checkOutDate || parsed.checkOutDate;
    const rooms = query?.rooms || parsed.rooms;
    const adults = parsed.adults;
    const children = parsed.children;
    const nights = this.nightsBetween(checkInDate, checkOutDate);

    const roomDocs = await this.roomModel
      .find({
        stay: new Types.ObjectId(parsed.stayId),
        quantity: { $gt: 0 },
      })
      .lean()
      .exec();

    return roomDocs.map((room: any) => {
      const total = Math.round(Number(room.pricePerNight) * nights * rooms * 100) / 100;
      return {
        name: room.name,
        photos: room.images?.length ? room.images : [],
        beds: [{ type: "double", count: 1 }],
        // Extra field consumed by the user app so it can book against our DB.
        roomId: room._id.toString(),
        rates: [
          {
            rateId: this.buildRateId(
              room._id.toString(),
              checkInDate,
              checkOutDate,
              rooms,
              adults,
              children,
            ),
            price: total,
            priceWithCommission: total,
            currency: "USD",
            boardType: "room_only",
            paymentType: "pay_now",
            cancellationTimeline: [
              {
                before: checkInDate,
                refundAmount: String(total),
                currency: "USD",
              },
            ],
            conditions: [
              {
                title: "Free cancellation",
                description:
                  "Free cancellation up to 24 hours before check-in.",
              },
            ],
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          },
        ],
      } as StaysRoomResult;
    });
  }

  async createQuote(rateId: string) {
    const parsed = this.parseRateId(rateId);
    if (!parsed) throw new NotFoundException("Rate not found");

    const room = await this.roomModel.findById(parsed.roomId).lean().exec();
    if (!room) throw new NotFoundException("Room not found");

    const nights = this.nightsBetween(parsed.checkInDate, parsed.checkOutDate);
    const total =
      Math.round(Number((room as any).pricePerNight) * nights * parsed.rooms * 100) / 100;

    const quoteId = this.buildQuoteId(
      parsed.roomId,
      parsed.checkInDate,
      parsed.checkOutDate,
      parsed.rooms,
      parsed.adults,
      parsed.children,
    );

    return {
      id: quoteId,
      quoteId,
      rateId,
      roomId: parsed.roomId,
      provider: this.providerName,
      checkInDate: parsed.checkInDate,
      checkOutDate: parsed.checkOutDate,
      rooms: parsed.rooms,
      adults: parsed.adults,
      children: parsed.children,
      nights,
      price: total,
      totalAmount: total,
      currency: "USD",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Confirms the reservation against our own inventory.
   *
   * The authoritative Booking document (and therefore the amount charged) is
   * created by the bookings module through POST /bookings, so this method only
   * has to validate the quote and decrement availability.
   */
  async createBooking(
    quoteId: string,
    guestDetails: any,
  ): Promise<StaysBookingResult> {
    const parsed = this.parseQuoteId(quoteId);
    if (!parsed) throw new NotFoundException("Quote not found");

    const room = await this.roomModel.findById(parsed.roomId).exec();
    if (!room) throw new NotFoundException("Room not found");
    if (room.quantity < parsed.rooms) {
      throw new NotFoundException("Not enough rooms available");
    }

    room.quantity -= parsed.rooms;
    await room.save();

    const stay = await this.stayModel.findById(room.stay).lean().exec();

    return {
      bookingId: quoteId,
      reference: `FBH${Date.now().toString(36).toUpperCase()}`,
      status: "confirmed",
      accommodationName: (stay as any)?.name || "Hotel",
      checkInDate: parsed.checkInDate,
      checkOutDate: parsed.checkOutDate,
      confirmedAt: new Date().toISOString(),
    };
  }

  async cancelBooking(bookingId: string) {
    const parsed = this.parseQuoteId(bookingId) || this.parseRateId(bookingId);
    if (parsed) {
      const room = await this.roomModel.findById(parsed.roomId).exec();
      if (room) {
        room.quantity += parsed.rooms;
        await room.save();
      }
    }
    return { status: "cancelled", bookingId };
  }
}
