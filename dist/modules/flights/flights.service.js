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
var FlightsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlightsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const cache_manager_1 = require("@nestjs/cache-manager");
const flight_schema_1 = require("./schemas/flight.schema");
const roles_constant_1 = require("../../common/constants/roles.constant");
let FlightsService = FlightsService_1 = class FlightsService {
    constructor(flightModel, cacheManager) {
        this.flightModel = flightModel;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(FlightsService_1.name);
        this.SEARCH_CACHE_TTL = 300000;
        this.POPULAR_CACHE_TTL = 600000;
    }
    async create(createFlightDto) {
        const flight = new this.flightModel({
            ...createFlightDto,
            tenant: createFlightDto.tenantId || null,
        });
        const saved = await flight.save();
        this.logger.log(`Flight created: ${saved.airline} ${saved.flightNumber} (${saved.departure.airport} → ${saved.arrival.airport})`);
        return saved;
    }
    async search(searchDto) {
        const cacheKey = `flights:search:${JSON.stringify(searchDto)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            this.logger.debug(`Cache hit for flight search: ${cacheKey}`);
            return cached;
        }
        const query = {
            'departure.airport': searchDto.origin.toUpperCase(),
            'arrival.airport': searchDto.destination.toUpperCase(),
            status: roles_constant_1.FlightStatus.SCHEDULED,
            isActive: true,
        };
        const departureDate = new Date(searchDto.departureDate);
        const nextDay = new Date(departureDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query['departure.time'] = {
            $gte: departureDate,
            $lt: nextDay,
        };
        if (searchDto.airline) {
            query.airline = { $regex: searchDto.airline, $options: 'i' };
        }
        if (searchDto.maxStops !== undefined) {
            query.stops = { $lte: searchDto.maxStops };
        }
        if (searchDto.class) {
            query['classes.type'] = searchDto.class;
        }
        if (searchDto.minPrice !== undefined || searchDto.maxPrice !== undefined) {
            const priceQuery = {};
            if (searchDto.minPrice !== undefined)
                priceQuery.$gte = searchDto.minPrice;
            if (searchDto.maxPrice !== undefined)
                priceQuery.$lte = searchDto.maxPrice;
            query['classes.basePrice'] = priceQuery;
        }
        const minPassengers = (searchDto.adults || 1) + (searchDto.children || 0) + (searchDto.infantsInSeat || 0);
        query['classes.seatsAvailable'] = { $gte: minPassengers };
        const sortOptions = {};
        const sortOrder = searchDto.sortOrder === 'desc' ? -1 : 1;
        switch (searchDto.sortBy) {
            case 'duration':
                sortOptions.duration = sortOrder;
                break;
            case 'departure':
                sortOptions['departure.time'] = sortOrder;
                break;
            case 'arrival':
                sortOptions['arrival.time'] = sortOrder;
                break;
            case 'price':
            default:
                sortOptions['classes.basePrice'] = sortOrder;
                break;
        }
        const page = searchDto.page || 1;
        const limit = searchDto.limit || 20;
        const skip = (page - 1) * limit;
        const [flights, total] = await Promise.all([
            this.flightModel
                .find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .populate('tenant', 'name slug logo settings')
                .lean()
                .exec(),
            this.flightModel.countDocuments(query).exec(),
        ]);
        const result = {
            data: flights,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1,
                searchCriteria: {
                    origin: searchDto.origin,
                    destination: searchDto.destination,
                    departureDate: searchDto.departureDate,
                    travelers: {
                        adults: searchDto.adults || 1,
                        children: searchDto.children || 0,
                        infantsOnLap: searchDto.infantsOnLap || 0,
                        infantsInSeat: searchDto.infantsInSeat || 0,
                    },
                    class: searchDto.class || 'all',
                },
            },
        };
        await this.cacheManager.set(cacheKey, result, this.SEARCH_CACHE_TTL);
        return result;
    }
    async findById(id) {
        const flight = await this.flightModel
            .findById(id)
            .populate('tenant', 'name slug logo settings')
            .lean()
            .exec();
        if (!flight) {
            throw new common_1.NotFoundException('Flight not found');
        }
        return flight;
    }
    async update(id, updateFlightDto) {
        const flight = await this.flightModel
            .findByIdAndUpdate(id, { $set: updateFlightDto }, { new: true })
            .exec();
        if (!flight) {
            throw new common_1.NotFoundException('Flight not found');
        }
        return flight;
    }
    async delete(id) {
        const result = await this.flightModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new common_1.NotFoundException('Flight not found');
        }
    }
    async getPopularFlights(limit = 10) {
        const cacheKey = `flights:popular:${limit}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached)
            return cached;
        const flights = await this.flightModel
            .find({
            status: roles_constant_1.FlightStatus.SCHEDULED,
            isActive: true,
            isFeatured: true,
            'departure.time': { $gte: new Date() },
        })
            .sort({ 'classes.basePrice': 1 })
            .limit(limit)
            .populate('tenant', 'name slug logo')
            .lean()
            .exec();
        await this.cacheManager.set(cacheKey, flights, this.POPULAR_CACHE_TTL);
        return flights;
    }
    async getDeals(limit = 10) {
        const cacheKey = `flights:deals:${limit}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached)
            return cached;
        const flights = await this.flightModel
            .find({
            status: roles_constant_1.FlightStatus.SCHEDULED,
            isActive: true,
            'departure.time': { $gte: new Date() },
        })
            .sort({ 'classes.basePrice': 1 })
            .limit(limit)
            .lean()
            .exec();
        await this.cacheManager.set(cacheKey, flights, this.POPULAR_CACHE_TTL);
        return flights;
    }
    async updateSeatAvailability(flightId, classType, seatsToReduce) {
        await this.flightModel.findOneAndUpdate({ _id: flightId, 'classes.type': classType }, { $inc: { 'classes.$.seatsAvailable': -seatsToReduce } }).exec();
    }
    async restoreSeatAvailability(flightId, classType, seatsToRestore) {
        await this.flightModel.findOneAndUpdate({ _id: flightId, 'classes.type': classType }, { $inc: { 'classes.$.seatsAvailable': seatsToRestore } }).exec();
    }
    async getTenantFlights(tenantId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.flightModel
                .find({ tenant: tenantId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.flightModel.countDocuments({ tenant: tenantId }).exec(),
        ]);
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
};
exports.FlightsService = FlightsService;
exports.FlightsService = FlightsService = FlightsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(flight_schema_1.Flight.name)),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [mongoose_2.Model, Object])
], FlightsService);
//# sourceMappingURL=flights.service.js.map