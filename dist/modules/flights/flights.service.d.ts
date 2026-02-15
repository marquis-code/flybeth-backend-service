import { Model } from 'mongoose';
import { Cache } from 'cache-manager';
import { FlightDocument } from './schemas/flight.schema';
import { CreateFlightDto, SearchFlightsDto, UpdateFlightDto } from './dto/flight.dto';
export declare class FlightsService {
    private flightModel;
    private cacheManager;
    private readonly logger;
    private readonly SEARCH_CACHE_TTL;
    private readonly POPULAR_CACHE_TTL;
    constructor(flightModel: Model<FlightDocument>, cacheManager: Cache);
    create(createFlightDto: CreateFlightDto): Promise<FlightDocument>;
    search(searchDto: SearchFlightsDto): Promise<{}>;
    findById(id: string): Promise<FlightDocument>;
    update(id: string, updateFlightDto: UpdateFlightDto): Promise<FlightDocument>;
    delete(id: string): Promise<void>;
    getPopularFlights(limit?: number): Promise<{}>;
    getDeals(limit?: number): Promise<{}>;
    updateSeatAvailability(flightId: string, classType: string, seatsToReduce: number): Promise<void>;
    restoreSeatAvailability(flightId: string, classType: string, seatsToRestore: number): Promise<void>;
    getTenantFlights(tenantId: string, page?: number, limit?: number): Promise<{
        data: (import("mongoose").FlattenMaps<FlightDocument> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
