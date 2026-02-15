import { Model } from 'mongoose';
import { CruiseDocument } from './schemas/cruise.schema';
import { SearchCruisesDto, CreateCruiseDto } from './dto/cruise.dto';
export declare class CruisesService {
    private cruiseModel;
    private readonly logger;
    constructor(cruiseModel: Model<CruiseDocument>);
    search(searchDto: SearchCruisesDto): Promise<CruiseDocument[]>;
    findById(id: string): Promise<CruiseDocument>;
    create(createCruiseDto: CreateCruiseDto): Promise<CruiseDocument>;
    updateCabinAvailability(cruiseId: string, cabinType: string, count: number): Promise<void>;
}
