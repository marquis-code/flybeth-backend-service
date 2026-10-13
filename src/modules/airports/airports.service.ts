// src/modules/airports/airports.service.ts
import { Injectable, Inject, NotFoundException, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { AmadeusHelperService } from "../integrations/providers/amadeus-helper.service";
import {
  Airport,
  AirportDocument,
  Airline,
  AirlineDocument,
} from "./schemas/airport.schema";

@Injectable()
export class AirportsService {
  private readonly logger = new Logger(AirportsService.name);

  constructor(
    @InjectModel(Airport.name) private airportModel: Model<AirportDocument>,
    @InjectModel(Airline.name) private airlineModel: Model<AirlineDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private amadeusHelper: AmadeusHelperService,
  ) {}

  async searchAirports(query: string, limit: number = 10) {
    const term = (query || "").trim();

    // An empty term must not reach MongoDB's $text operator (it throws).
    if (!term) {
      return this.airportModel.find().limit(limit).lean().exec();
    }

    const cacheKey = `airports:search:${term}:${limit}`;
    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) return cached;
    } catch (err) {
      // Ignore cache error
    }

    let results: any[] = [];
    try {
      results = await this.airportModel
        .find({ $text: { $search: term } }, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .lean()
        .exec();
    } catch (err) {
      // Missing text index — fall through to the regex search below.
      this.logger.warn(`Airport text search failed, using regex: ${err.message}`);
      results = [];
    }

    // Fallback to regex search if no text search results
    if (results.length === 0) {
      const regex = new RegExp(this.escapeRegex(term), "i");
      const regexResults = await this.airportModel
        .find({
          $or: [
            { code: regex },
            { name: regex },
            { city: regex },
            { country: regex },
          ],
        })
        .limit(limit)
        .lean()
        .exec();

      try {
        await this.cacheManager.set(cacheKey, regexResults, 86400000); // 24h cache
      } catch (err) {
        // Ignore cache error
      }
      return regexResults;
    }

    await this.cacheManager.set(cacheKey, results, 86400000);
    return results;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async getAirportByCode(code: string): Promise<AirportDocument> {
    const airport = await this.airportModel
      .findOne({ code: code.toUpperCase() })
      .lean()
      .exec();
    if (!airport) throw new NotFoundException("Airport not found");
    return airport as unknown as AirportDocument;
  }

  async searchAirlines(query: string, limit: number = 10) {
    const cacheKey = `airlines:search:${query}:${limit}`;
    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) return cached;
    } catch (err) {
      // Ignore cache error
    }

    const results = await this.airlineModel
      .find(
        { $text: { $search: query }, isActive: true },
        { score: { $meta: "textScore" } },
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .lean()
      .exec();

    if (results.length === 0) {
      const regex = new RegExp(query, "i");
      const regexResults = await this.airlineModel
        .find({
          $or: [{ code: regex }, { name: regex }],
          isActive: true,
        })
        .limit(limit)
        .lean()
        .exec();

      try {
        await this.cacheManager.set(cacheKey, regexResults, 86400000);
      } catch (err) {
        // Ignore cache error
      }
      return regexResults;
    }

    await this.cacheManager.set(cacheKey, results, 86400000);
    return results;
  }

  async getAirlineByCode(code: string): Promise<AirlineDocument> {
    const airline = await this.airlineModel
      .findOne({ code: code.toUpperCase() })
      .lean()
      .exec();
    if (!airline) throw new NotFoundException("Airline not found");
    return airline as unknown as AirlineDocument;
  }

  async getAllAirports(): Promise<AirportDocument[]> {
    const cacheKey = "airports:all";
    const cached = await this.cacheManager.get<AirportDocument[]>(cacheKey);
    if (cached) return cached;

    const airports = await this.airportModel
      .find()
      .sort({ city: 1 })
      .lean()
      .exec();
    await this.cacheManager.set(cacheKey, airports, 86400000);
    return airports as unknown as AirportDocument[];
  }

  async getAllAirlines(): Promise<AirlineDocument[]> {
    const cacheKey = "airlines:all";
    const cached = await this.cacheManager.get<AirlineDocument[]>(cacheKey);
    if (cached) return cached;

    const airlines = await this.airlineModel
      .find({ isActive: true })
      .sort({ name: 1 })
      .lean()
      .exec();
    await this.cacheManager.set(cacheKey, airlines, 86400000);
    return airlines as unknown as AirlineDocument[];
  }

  async searchCities(
    keyword: string,
    limit: number = 10,
    countryCode?: string,
  ) {
    const cacheKey = `cities:search:${keyword}:${limit}:${countryCode}`;
    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) return cached;
    } catch (err) {
      // Ignore cache error
    }

    let results: any[] = [];
    try {
      results = await this.amadeusHelper.searchCities(
        keyword,
        limit,
        countryCode,
      );
    } catch (err) {
      this.logger.warn(`Amadeus city search unavailable: ${err.message}`);
      results = [];
    }

    // Derive city results from our own airport reference data when the live
    // provider is unavailable (Amadeus Self-Service was retired).
    if (!Array.isArray(results) || results.length === 0) {
      try {
        const airports = (await this.searchAirports(keyword, limit)) as any[];
        const seen = new Set<string>();
        results = (airports || [])
          .filter((a: any) => {
            const key = `${a.city}|${a.countryCode || a.country}`.toLowerCase();
            if (!a.city || seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map((a: any) => ({
            name: a.city,
            cityCode: a.cityCode || a.code,
            countryCode: a.countryCode || a.country,
            countryName: a.country,
            geoCode: {
              latitude: a.latitude ?? a.location?.latitude,
              longitude: a.longitude ?? a.location?.longitude,
            },
            provider: "flybeth",
          }));
      } catch (err) {
        this.logger.warn(`Local city search failed: ${err.message}`);
      }
    }

    try {
      await this.cacheManager.set(cacheKey, results, 86400000); // 24h cache
    } catch (err) {
      // Ignore cache error
    }
    return results;
  }
}
