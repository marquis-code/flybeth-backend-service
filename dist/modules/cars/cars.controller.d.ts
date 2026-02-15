import { CarsService } from './cars.service';
import { SearchCarsDto, CreateCarDto } from './dto/car.dto';
export declare class CarsController {
    private readonly carsService;
    constructor(carsService: CarsService);
    search(searchDto: SearchCarsDto): Promise<import("./schemas/car.schema").CarDocument[]>;
    findById(id: string): Promise<import("./schemas/car.schema").CarDocument>;
    create(createCarDto: CreateCarDto): Promise<import("./schemas/car.schema").CarDocument>;
    findAll(): Promise<import("./schemas/car.schema").CarDocument[]>;
}
