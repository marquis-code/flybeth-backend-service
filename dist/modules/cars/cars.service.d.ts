import { Model } from 'mongoose';
import { CarDocument } from './schemas/car.schema';
import { SearchCarsDto, CreateCarDto } from './dto/car.dto';
export declare class CarsService {
    private carModel;
    private readonly logger;
    constructor(carModel: Model<CarDocument>);
    search(searchDto: SearchCarsDto): Promise<CarDocument[]>;
    findById(id: string): Promise<CarDocument>;
    create(createCarDto: CreateCarDto): Promise<CarDocument>;
    findAll(): Promise<CarDocument[]>;
}
