// src/modules/cruises/cruises.service.ts
import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Cruise, CruiseDocument } from "./schemas/cruise.schema";
import { SearchCruisesDto, CreateCruiseDto } from "./dto/cruise.dto";

import { TraveltekProvider } from "../integrations/providers/traveltek.provider";

@Injectable()
export class CruisesService {
  private readonly logger = new Logger(CruisesService.name);

  constructor(
    @InjectModel(Cruise.name) private cruiseModel: Model<CruiseDocument>,
    private readonly traveltekProvider: TraveltekProvider
  ) {}

  async search(searchDto: SearchCruisesDto): Promise<any[]> {
    try {
      const traveltekArgs: any = {
        destination: searchDto.destination,
        cruiseLine: searchDto.cruiseLine,
        durationMin: searchDto.minNights,
        durationMax: searchDto.maxNights,
      };

      if (searchDto.departureMonth) {
        const start = new Date(`${searchDto.departureMonth}-01`);
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        traveltekArgs.embarkEarliestDate = start.toISOString().split("T")[0];
        traveltekArgs.embarkLatestDate = end.toISOString().split("T")[0];
      }

      const traveltekRes = await this.traveltekProvider.searchCruises(traveltekArgs);
      
      const results = traveltekRes?.data?.cruises?.searchResults || [];
      
      return results.map((result: any) => {
        const cabinClasses = result.leadInPrices ? result.leadInPrices.map((price: any) => ({
          type: price.cabinType || price.cabinDescription || "Standard",
          price: price.fare,
          availability: price.available ? 10 : 0
        })) : [];

        return {
          _id: result.id || Math.random().toString(36).substring(7), // Map to _id for frontend compatibility
          name: result.product?.name || result.ship?.name || "Unknown Cruise",
          destination: searchDto.destination !== "Any" ? searchDto.destination : "Multiple Destinations",
          cruiseLine: result.ship?.line?.name || "Unknown Line",
          departurePort: result.embarkPort || "Unknown Port",
          departureDate: result.embarkDate,
          durationNights: result.duration,
          cabinClasses: cabinClasses,
          images: [], // Traveltek doesn't return images in search, fallback to empty array
          isAvailable: true,
          description: result.product?.description || ""
        };
      });
    } catch (error) {
      this.logger.error("Failed to search Traveltek cruises, falling back to local database", error);
      // Fallback to local DB if Traveltek fails
      const query: any = { isAvailable: true };

      if (searchDto.destination && searchDto.destination !== "Any") {
        query.destination = new RegExp(searchDto.destination, "i");
      }

      if (searchDto.cruiseLine && searchDto.cruiseLine !== "Any") {
        query.cruiseLine = new RegExp(searchDto.cruiseLine, "i");
      }

      if (searchDto.minNights || searchDto.maxNights) {
        query.durationNights = {};
        if (searchDto.minNights) query.durationNights.$gte = searchDto.minNights;
        if (searchDto.maxNights) query.durationNights.$lte = searchDto.maxNights;
      }

      if (searchDto.departureMonth) {
        const start = new Date(`${searchDto.departureMonth}-01`);
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        query.departureDate = { $gte: start, $lte: end };
      }

      return this.cruiseModel.find(query).exec();
    }
  }

  async findById(id: string): Promise<CruiseDocument> {
    const cruise = await this.cruiseModel.findById(id).exec();
    if (!cruise) throw new NotFoundException(`Cruise with ID ${id} not found`);
    return cruise;
  }

  async create(createCruiseDto: CreateCruiseDto): Promise<CruiseDocument> {
    const newCruise = new this.cruiseModel(createCruiseDto);
    return newCruise.save();
  }

  async updateCabinAvailability(
    cruiseId: string,
    cabinType: string,
    count: number,
  ): Promise<void> {
    const cruise = await this.findById(cruiseId);
    const cabin = cruise.cabinClasses.find((c) => c.type === cabinType);
    if (!cabin)
      throw new NotFoundException(`Cabin type ${cabinType} not found`);

    cabin.availability -= count;
    await (cruise as any).save();
  }
}
