import { PassengersService } from './passengers.service';
import { CreatePassengerDto, UpdatePassengerDto } from './dto/passenger.dto';
export declare class PassengersController {
    private readonly passengersService;
    constructor(passengersService: PassengersService);
    create(userId: string, dto: CreatePassengerDto): Promise<import("./schemas/passenger.schema").PassengerDocument>;
    findAll(userId: string): Promise<import("./schemas/passenger.schema").PassengerDocument[]>;
    findOne(id: string): Promise<import("./schemas/passenger.schema").PassengerDocument>;
    update(id: string, userId: string, dto: UpdatePassengerDto): Promise<import("./schemas/passenger.schema").PassengerDocument>;
    remove(id: string, userId: string): Promise<void>;
}
