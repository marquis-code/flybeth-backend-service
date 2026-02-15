import { FlightsService } from './flights.service';
import { CreateFlightDto, SearchFlightsDto, UpdateFlightDto } from './dto/flight.dto';
export declare class FlightsController {
    private readonly flightsService;
    constructor(flightsService: FlightsService);
    search(searchDto: SearchFlightsDto): Promise<{}>;
    getPopular(limit?: number): Promise<{}>;
    getDeals(limit?: number): Promise<{}>;
    findOne(id: string): Promise<import("./schemas/flight.schema").FlightDocument>;
    create(createFlightDto: CreateFlightDto): Promise<import("./schemas/flight.schema").FlightDocument>;
    update(id: string, updateFlightDto: UpdateFlightDto): Promise<import("./schemas/flight.schema").FlightDocument>;
    remove(id: string): Promise<void>;
}
