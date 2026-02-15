// src/modules/cars/cars.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Car, CarDocument } from './schemas/car.schema';
import { SearchCarsDto, CreateCarDto } from './dto/car.dto';

@Injectable()
export class CarsService {
    private readonly logger = new Logger(CarsService.name);

    constructor(
        @InjectModel(Car.name) private carModel: Model<CarDocument>,
    ) { }

    async search(searchDto: SearchCarsDto): Promise<CarDocument[]> {
        const query: any = {
            type: searchDto.type,
            isAvailable: true,
        };

        if (searchDto.pickUpLocation) {
            // Simple regex match for location (city or code)
            query.availableLocations = {
                $in: [new RegExp(searchDto.pickUpLocation, 'i')]
            };
        }

        if (searchDto.category) {
            query.category = searchDto.category;
        }

        if (searchDto.passengers) {
            query['capacity.passengers'] = { $gte: searchDto.passengers };
        }

        return this.carModel.find(query).exec();
    }

    async findById(id: string): Promise<CarDocument> {
        const car = await this.carModel.findById(id).exec();
        if (!car) throw new NotFoundException(`Car with ID ${id} not found`);
        return car;
    }

    async create(createCarDto: CreateCarDto): Promise<CarDocument> {
        const newCar = new this.carModel(createCarDto);
        return newCar.save();
    }

    async findAll(): Promise<CarDocument[]> {
        return this.carModel.find().exec();
    }
}
