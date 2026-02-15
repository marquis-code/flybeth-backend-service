import { AirportsService } from './airports.service';
export declare class AirportsController {
    private readonly airportsService;
    constructor(airportsService: AirportsService);
    searchAirports(query: string, limit?: number): Promise<{}>;
    getAllAirports(): Promise<import("./schemas/airport.schema").AirportDocument[]>;
    getAirport(code: string): Promise<import("./schemas/airport.schema").AirportDocument>;
    searchAirlines(query: string, limit?: number): Promise<{}>;
    getAllAirlines(): Promise<import("./schemas/airport.schema").AirlineDocument[]>;
    getAirline(code: string): Promise<import("./schemas/airport.schema").AirlineDocument>;
}
