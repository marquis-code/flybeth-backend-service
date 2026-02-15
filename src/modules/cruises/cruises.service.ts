// src/modules/cruises/cruises.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cruise, CruiseDocument } from './schemas/cruise.schema';
import { SearchCruisesDto, CreateCruiseDto } from './dto/cruise.dto';

@Injectable()
export class CruisesService {
    private readonly logger = new Logger(CruisesService.name);

    constructor(
        @InjectModel(Cruise.name) private cruiseModel: Model<CruiseDocument>,
    ) { }

    async search(searchDto: SearchCruisesDto): Promise<CruiseDocument[]> {
        const query: any = { isAvailable: true };

        if (searchDto.destination && searchDto.destination !== 'Any') {
            query.destination = new RegExp(searchDto.destination, 'i');
        }

        if (searchDto.cruiseLine && searchDto.cruiseLine !== 'Any') {
            query.cruiseLine = new RegExp(searchDto.cruiseLine, 'i');
        }

        if (searchDto.minNights || searchDto.maxNights) {
            query.durationNights = {};
            if (searchDto.minNights) query.durationNights.$gte = searchDto.minNights;
            if (searchDto.maxNights) query.durationNights.$lte = searchDto.maxNights;
        }

        if (searchDto.departureMonth) {
            const start = new Date(`${searchDto.departureMonth}-01`);
            const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            query.departureDate = { $gte: start, $lte: end };
        }

        return this.cruiseModel.find(query).exec();
    }

    async findById(id: string): Promise<CruiseDocument> {
        const cruise = await this.cruiseModel.findById(id).exec();
        if (!cruise) throw new NotFoundException(`Cruise with ID ${id} not found`);
        return cruise;
    }

    async create(createCruiseDto: CreateCruiseDto): Promise<CruiseDocument> {
        const newCruise = new this.cruiseModel(createCruiseDto);
        return newCruise.save();
    }

    async updateCabinAvailability(cruiseId: string, cabinType: string, count: number): Promise<void> {
        const cruise = await this.findById(cruiseId);
        const cabin = cruise.cabinClasses.find(c => c.type === cabinType);
        if (!cabin) throw new NotFoundException(`Cabin type ${cabinType} not found`);

        cabin.availability -= count;
        await (cruise as any).save();
    }
}
