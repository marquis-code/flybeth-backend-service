"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirportsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const cache_manager_1 = require("@nestjs/cache-manager");
const airport_schema_1 = require("./schemas/airport.schema");
let AirportsService = class AirportsService {
    constructor(airportModel, airlineModel, cacheManager) {
        this.airportModel = airportModel;
        this.airlineModel = airlineModel;
        this.cacheManager = cacheManager;
    }
    async searchAirports(query, limit = 10) {
        const cacheKey = `airports:search:${query}:${limit}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached)
            return cached;
        const results = await this.airportModel
            .find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
            .limit(limit)
            .lean()
            .exec();
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
            await this.cacheManager.set(cacheKey, regexResults, 86400000);
            return regexResults;
        }
        await this.cacheManager.set(cacheKey, results, 86400000);
        return results;
    }
    async getAirportByCode(code) {
        const airport = await this.airportModel.findOne({ code: code.toUpperCase() }).lean().exec();
        if (!airport)
            throw new common_1.NotFoundException('Airport not found');
        return airport;
    }
    async searchAirlines(query, limit = 10) {
        const cacheKey = `airlines:search:${query}:${limit}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached)
            return cached;
        const results = await this.airlineModel
            .find({ $text: { $search: query }, isActive: true }, { score: { $meta: 'textScore' } })
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
    async getAirlineByCode(code) {
        const airline = await this.airlineModel.findOne({ code: code.toUpperCase() }).lean().exec();
        if (!airline)
            throw new common_1.NotFoundException('Airline not found');
        return airline;
    }
    async getAllAirports() {
        const cacheKey = 'airports:all';
        const cached = await this.cacheManager.get(cacheKey);
        if (cached)
            return cached;
        const airports = await this.airportModel.find().sort({ city: 1 }).lean().exec();
        await this.cacheManager.set(cacheKey, airports, 86400000);
        return airports;
    }
    async getAllAirlines() {
        const cacheKey = 'airlines:all';
        const cached = await this.cacheManager.get(cacheKey);
        if (cached)
            return cached;
        const airlines = await this.airlineModel.find({ isActive: true }).sort({ name: 1 }).lean().exec();
        await this.cacheManager.set(cacheKey, airlines, 86400000);
        return airlines;
    }
};
exports.AirportsService = AirportsService;
exports.AirportsService = AirportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(airport_schema_1.Airport.name)),
    __param(1, (0, mongoose_1.InjectModel)(airport_schema_1.Airline.name)),
    __param(2, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model, Object])
], AirportsService);
//# sourceMappingURL=airports.service.js.map