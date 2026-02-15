// src/modules/flights/flights.service.ts
import {
    Injectable,
    NotFoundException,
    Inject,
    Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Flight, FlightDocument } from './schemas/flight.schema';
import { CreateFlightDto, SearchFlightsDto, UpdateFlightDto } from './dto/flight.dto';
import { FlightStatus } from '../../common/constants/roles.constant';

@Injectable()
export class FlightsService {
    private readonly logger = new Logger(FlightsService.name);
    private readonly SEARCH_CACHE_TTL = 300000; // 5 minutes
    private readonly POPULAR_CACHE_TTL = 600000; // 10 minutes

    constructor(
        @InjectModel(Flight.name) private flightModel: Model<FlightDocument>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async create(createFlightDto: CreateFlightDto): Promise<FlightDocument> {
        const flight = new this.flightModel({
            ...createFlightDto,
            tenant: createFlightDto.tenantId || null,
        });

        const saved = await flight.save();
        this.logger.log(
            `Flight created: ${saved.airline} ${saved.flightNumber} (${saved.departure.airport} → ${saved.arrival.airport})`,
        );
        return saved;
    }

    async search(searchDto: SearchFlightsDto) {
        // Build cache key from search params
        const cacheKey = `flights:search:${JSON.stringify(searchDto)}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            this.logger.debug(`Cache hit for flight search: ${cacheKey}`);
            return cached;
        }

        const query: any = {
            'departure.airport': searchDto.origin.toUpperCase(),
            'arrival.airport': searchDto.destination.toUpperCase(),
            status: FlightStatus.SCHEDULED,
            isActive: true,
        };

        // Date range: match departure on the specified date
        const departureDate = new Date(searchDto.departureDate);
        const nextDay = new Date(departureDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query['departure.time'] = {
            $gte: departureDate,
            $lt: nextDay,
        };

        // Airline filter
        if (searchDto.airline) {
            query.airline = { $regex: searchDto.airline, $options: 'i' };
        }

        // Max stops filter
        if (searchDto.maxStops !== undefined) {
            query.stops = { $lte: searchDto.maxStops };
        }

        // Class filter
        if (searchDto.class) {
            query['classes.type'] = searchDto.class;
        }

        // Price range filter
        if (searchDto.minPrice !== undefined || searchDto.maxPrice !== undefined) {
            const priceQuery: any = {};
            if (searchDto.minPrice !== undefined) priceQuery.$gte = searchDto.minPrice;
            if (searchDto.maxPrice !== undefined) priceQuery.$lte = searchDto.maxPrice;
            query['classes.basePrice'] = priceQuery;
        }

        // Seat availability check
        const minPassengers = (searchDto.adults || 1) + (searchDto.children || 0) + (searchDto.infantsInSeat || 0);
        query['classes.seatsAvailable'] = { $gte: minPassengers };

        // Sort options
        const sortOptions: Record<string, 1 | -1> = {};
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

        // Cache search results
        await this.cacheManager.set(cacheKey, result, this.SEARCH_CACHE_TTL);

        return result;
    }

    async findById(id: string): Promise<FlightDocument> {
        const flight = await this.flightModel
            .findById(id)
            .populate('tenant', 'name slug logo settings')
            .lean()
            .exec();

        if (!flight) {
            throw new NotFoundException('Flight not found');
        }
        return flight as unknown as FlightDocument;
    }

    async update(id: string, updateFlightDto: UpdateFlightDto): Promise<FlightDocument> {
        const flight = await this.flightModel
            .findByIdAndUpdate(id, { $set: updateFlightDto }, { new: true })
            .exec();

        if (!flight) {
            throw new NotFoundException('Flight not found');
        }
        return flight;
    }

    async delete(id: string): Promise<void> {
        const result = await this.flightModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException('Flight not found');
        }
    }

    async getPopularFlights(limit: number = 10) {
        const cacheKey = `flights:popular:${limit}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) return cached;

        const flights = await this.flightModel
            .find({
                status: FlightStatus.SCHEDULED,
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

    async getDeals(limit: number = 10) {
        const cacheKey = `flights:deals:${limit}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) return cached;

        const flights = await this.flightModel
            .find({
                status: FlightStatus.SCHEDULED,
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

    async updateSeatAvailability(
        flightId: string,
        classType: string,
        seatsToReduce: number,
    ): Promise<void> {
        await this.flightModel.findOneAndUpdate(
            { _id: flightId, 'classes.type': classType },
            { $inc: { 'classes.$.seatsAvailable': -seatsToReduce } },
        ).exec();
    }

    async restoreSeatAvailability(
        flightId: string,
        classType: string,
        seatsToRestore: number,
    ): Promise<void> {
        await this.flightModel.findOneAndUpdate(
            { _id: flightId, 'classes.type': classType },
            { $inc: { 'classes.$.seatsAvailable': seatsToRestore } },
        ).exec();
    }

    async getTenantFlights(
        tenantId: string,
        page: number = 1,
        limit: number = 20,
    ) {
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
}
