// src/modules/integrations/providers/local-transfers.provider.ts
//
// Platform-owned airport transfer inventory. This adapter makes the transfer
// funnel work even when none of the external ground-transport partners are
// configured (Amadeus Self-Service is retired, Hotelbeds needs signed
// credentials, Welcome Pickups needs an API key).

import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  TransfersAdapter,
  TransferSearchQuery,
  TransferSearchResult,
  TransferOrderingResult,
} from "../interfaces/transfers-adapter.interface";
import {
  TransferInventory,
  TransferInventoryDocument,
} from "../schemas/local-inventory.schema";

export const LOCAL_TRANSFERS_PROVIDER = "flybeth-transfers";

@Injectable()
export class LocalTransfersProvider implements TransfersAdapter {
  readonly providerName = LOCAL_TRANSFERS_PROVIDER;
  private readonly logger = new Logger(LocalTransfersProvider.name);

  constructor(
    @InjectModel(TransferInventory.name)
    private transferModel: Model<TransferInventoryDocument>,
  ) {}

  async searchTransfers(
    query: TransferSearchQuery,
  ): Promise<TransferSearchResult[]> {
    const origin = (query.startLocationCode || "").toUpperCase().trim();
    const city = (query.endCityName || "").trim();
    const pax = Number(query.passengers) || 1;

    const filter: any = { isActive: true, maxPassengers: { $gte: pax } };
    if (origin) {
      filter.$or = [
        { startLocationCode: origin },
        { startLocationCode: "ALL" },
      ];
      if (city) {
        filter.$or.push({ city: new RegExp(`^${this.escapeRegex(city)}$`, "i") });
      }
    }

    if (query.transferType && query.transferType !== "ALL") {
      filter.transferType = { $in: [query.transferType, "ALL"] };
    }

    let items = await this.transferModel.find(filter).lean().exec();

    // If the airport code did not match (unknown code) fall back to city only.
    if (!items.length && city) {
      items = await this.transferModel
        .find({
          isActive: true,
          maxPassengers: { $gte: pax },
          city: new RegExp(this.escapeRegex(city), "i"),
        })
        .lean()
        .exec();
    }

    // Last resort: never show an empty transfer page for our own inventory.
    if (!items.length) {
      items = await this.transferModel
        .find({ isActive: true, maxPassengers: { $gte: pax } })
        .limit(12)
        .lean()
        .exec();
    }

    this.logger.log(`Local transfers returned ${items.length} results`);

    return items.map((t: any) => ({
      provider: this.providerName,
      offerId: t._id.toString(),
      transferType: t.transferType === "ALL" ? "PRIVATE" : t.transferType,
      vehicleCode: t.vehicleCode,
      vehicleDescription: t.vehicleDescription,
      name: t.name,
      price: t.basePrice,
      currency: t.currency || "USD",
      duration: `${t.durationMinutes || 60} mins`,
      cancellationPolicy:
        t.cancellationPolicy ||
        "Free cancellation up to 24 hours before pickup",
      images: t.images || [],
      startLocationCode: t.startLocationCode,
      city: t.city,
      maxPassengers: t.maxPassengers,
      maxLuggage: t.maxLuggage,
    })) as TransferSearchResult[];
  }

  async createTransferOrder(
    offerId: string,
    passengerDetails: any,
  ): Promise<TransferOrderingResult> {
    const item = await this.transferModel.findById(offerId).lean().exec();
    if (!item) throw new NotFoundException("Transfer offer not found");

    return {
      orderId: offerId,
      status: "confirmed",
      confirmationNumber: `FBT${Date.now().toString(36).toUpperCase()}`,
    };
  }

  async cancelTransferOrder(orderId: string) {
    return {
      status: "cancelled",
      confirmNbr: `FBT${Date.now().toString(36).toUpperCase()}`,
    };
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
