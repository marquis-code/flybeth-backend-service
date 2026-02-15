import { Model } from 'mongoose';
import { PassengerDocument } from './schemas/passenger.schema';
import { CreatePassengerDto, UpdatePassengerDto } from './dto/passenger.dto';
export declare class PassengersService {
    private passengerModel;
    constructor(passengerModel: Model<PassengerDocument>);
    create(userId: string, dto: CreatePassengerDto): Promise<PassengerDocument>;
    findByUser(userId: string): Promise<PassengerDocument[]>;
    findById(id: string): Promise<PassengerDocument>;
    update(id: string, userId: string, dto: UpdatePassengerDto): Promise<PassengerDocument>;
    delete(id: string, userId: string): Promise<void>;
}
