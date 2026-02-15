// src/modules/airports/airports.service.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Airport, AirportDocument, Airline, AirlineDocument } from './schemas/airport.schema';

@Injectable()
export class AirportsService {
    constructor(
        @InjectModel(Airport.name) private airportModel: Model<AirportDocument>,
        @InjectModel(Airline.name) private airlineModel: Model<AirlineDocument>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async searchAirports(query: string, limit: number = 10) {
        const cacheKey = `airports:search:${query}:${limit}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) return cached;

        const results = await this.airportModel
            .find(
                { $text: { $search: query } },
                { score: { $meta: 'textScore' } },
            )
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
            .lean()
            .exec();

        // Fallback to regex search if no text search results
        if (results.length === 0) {
            const regex = new RegExp(query, 'i');
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

            await this.cacheManager.set(cacheKey, regexResults, 86400000); // 24h cache
            return regexResults;
        }

        await this.cacheManager.set(cacheKey, results, 86400000);
        return results;
    }

    async getAirportByCode(code: string): Promise<AirportDocument> {
        const airport = await this.airportModel.findOne({ code: code.toUpperCase() }).lean().exec();
        if (!airport) throw new NotFoundException('Airport not found');
        return airport as unknown as AirportDocument;
    }

    async searchAirlines(query: string, limit: number = 10) {
        const cacheKey = `airlines:search:${query}:${limit}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) return cached;

        const results = await this.airlineModel
            .find(
                { $text: { $search: query }, isActive: true },
                { score: { $meta: 'textScore' } },
            )
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
            .lean()
            .exec();

        if (results.length === 0) {
            const regex = new RegExp(query, 'i');
            const regexResults = await this.airlineModel
                .find({
                    $or: [{ code: regex }, { name: regex }],
                    isActive: true,
                })
                .limit(limit)
                .lean()
                .exec();

            await this.cacheManager.set(cacheKey, regexResults, 86400000);
            return regexResults;
        }

        await this.cacheManager.set(cacheKey, results, 86400000);
        return results;
    }

    async getAirlineByCode(code: string): Promise<AirlineDocument> {
        const airline = await this.airlineModel.findOne({ code: code.toUpperCase() }).lean().exec();
        if (!airline) throw new NotFoundException('Airline not found');
        return airline as unknown as AirlineDocument;
    }

    async getAllAirports(): Promise<AirportDocument[]> {
        const cacheKey = 'airports:all';
        const cached = await this.cacheManager.get<AirportDocument[]>(cacheKey);
        if (cached) return cached;

        const airports = await this.airportModel.find().sort({ city: 1 }).lean().exec();
        await this.cacheManager.set(cacheKey, airports, 86400000);
        return airports as unknown as AirportDocument[];
    }

    async getAllAirlines(): Promise<AirlineDocument[]> {
        const cacheKey = 'airlines:all';
        const cached = await this.cacheManager.get<AirlineDocument[]>(cacheKey);
        if (cached) return cached;

        const airlines = await this.airlineModel.find({ isActive: true }).sort({ name: 1 }).lean().exec();
        await this.cacheManager.set(cacheKey, airlines, 86400000);
        return airlines as unknown as AirlineDocument[];
    }
}
