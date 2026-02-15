import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { AirportDocument, AirlineDocument } from '../airports/schemas/airport.schema';
export declare class SeedService implements OnModuleInit {
    private airportModel;
    private airlineModel;
    private readonly logger;
    constructor(airportModel: Model<AirportDocument>, airlineModel: Model<AirlineDocument>);
    onModuleInit(): Promise<void>;
    private seedAirports;
    private seedAirlines;
}
