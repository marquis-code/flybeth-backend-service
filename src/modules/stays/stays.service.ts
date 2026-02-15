// src/modules/stays/stays.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Stay, StayDocument } from './schemas/stay.schema';
import { Room, RoomDocument } from './schemas/room.schema';
import { StaySearchDto } from './dto/stays.dto';

@Injectable()
export class StaysService {
    constructor(
        @InjectModel(Stay.name) private stayModel: Model<StayDocument>,
        @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    ) { }

    async createStay(createDto: any): Promise<StayDocument> {
        const stay = new this.stayModel(createDto);
        return stay.save();
    }

    async search(query: StaySearchDto): Promise<StayDocument[]> {
        const filter: any = { isActive: true };
        if (query.city) filter['location.city'] = new RegExp(query.city, 'i');
        if (query.country) filter['location.country'] = new RegExp(query.country, 'i');

        // Note: For occupancy filtering, we would typically check room capacity in an aggregation
        // or join, but for now we keep it simple to ensure alignment with UI capabilities.

        return this.stayModel.find(filter).exec();
    }

    async getStayById(id: string): Promise<StayDocument> {
        const stay = await this.stayModel.findById(id).exec();
        if (!stay) throw new NotFoundException('Stay not found');
        return stay;
    }

    async addRoom(stayId: string, createRoomDto: any): Promise<RoomDocument> {
        const room = new this.roomModel({ ...createRoomDto, stay: stayId });
        return room.save();
    }

    async getRooms(stayId: string): Promise<RoomDocument[]> {
        return this.roomModel.find({ stay: stayId }).exec();
    }

    async getRoomById(id: string): Promise<RoomDocument> {
        const room = await this.roomModel.findById(id).exec();
        if (!room) throw new NotFoundException('Room not found');
        return room;
    }

    async updateRoomAvailability(roomId: string, quantityChange: number): Promise<void> {
        const room = await this.getRoomById(roomId);
        if (room.quantity < quantityChange && quantityChange > 0) {
            throw new BadRequestException('Not enough rooms available');
        }
        room.quantity -= quantityChange;
        await room.save();
    }
}
