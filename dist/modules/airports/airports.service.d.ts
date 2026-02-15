import { Model } from 'mongoose';
import { Cache } from 'cache-manager';
import { AirportDocument, AirlineDocument } from './schemas/airport.schema';
export declare class AirportsService {
    private airportModel;
    private airlineModel;
    private cacheManager;
    constructor(airportModel: Model<AirportDocument>, airlineModel: Model<AirlineDocument>, cacheManager: Cache);
    searchAirports(query: string, limit?: number): Promise<{}>;
    getAirportByCode(code: string): Promise<AirportDocument>;
    searchAirlines(query: string, limit?: number): Promise<{}>;
    getAirlineByCode(code: string): Promise<AirlineDocument>;
    getAllAirports(): Promise<AirportDocument[]>;
    getAllAirlines(): Promise<AirlineDocument[]>;
}
