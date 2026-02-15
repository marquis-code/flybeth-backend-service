// src/modules/passengers/passengers.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Passenger, PassengerDocument } from './schemas/passenger.schema';
import { CreatePassengerDto, UpdatePassengerDto } from './dto/passenger.dto';

@Injectable()
export class PassengersService {
    constructor(
        @InjectModel(Passenger.name) private passengerModel: Model<PassengerDocument>,
    ) { }

    async create(userId: string, dto: CreatePassengerDto): Promise<PassengerDocument> {
        const passenger = new this.passengerModel({ ...dto, user: userId });
        return passenger.save();
    }

    async findByUser(userId: string): Promise<PassengerDocument[]> {
        return this.passengerModel.find({ user: userId }).lean().exec() as unknown as Promise<PassengerDocument[]>;
    }

    async findById(id: string): Promise<PassengerDocument> {
        const passenger = await this.passengerModel.findById(id).lean().exec();
        if (!passenger) throw new NotFoundException('Passenger not found');
        return passenger as unknown as PassengerDocument;
    }

    async update(id: string, userId: string, dto: UpdatePassengerDto): Promise<PassengerDocument> {
        const passenger = await this.passengerModel
            .findOneAndUpdate({ _id: id, user: userId }, { $set: dto }, { new: true })
            .exec();
        if (!passenger) throw new NotFoundException('Passenger not found');
        return passenger;
    }

    async delete(id: string, userId: string): Promise<void> {
        const result = await this.passengerModel.findOneAndDelete({ _id: id, user: userId }).exec();
        if (!result) throw new NotFoundException('Passenger not found');
    }
}
