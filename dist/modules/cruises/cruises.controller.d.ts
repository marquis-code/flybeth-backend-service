import { CruisesService } from './cruises.service';
import { SearchCruisesDto, CreateCruiseDto } from './dto/cruise.dto';
export declare class CruisesController {
    private readonly cruisesService;
    constructor(cruisesService: CruisesService);
    search(searchDto: SearchCruisesDto): Promise<import("./schemas/cruise.schema").CruiseDocument[]>;
    findById(id: string): Promise<import("./schemas/cruise.schema").CruiseDocument>;
    create(createCruiseDto: CreateCruiseDto): Promise<import("./schemas/cruise.schema").CruiseDocument>;
}
