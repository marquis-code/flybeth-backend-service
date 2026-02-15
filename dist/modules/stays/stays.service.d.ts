import { Model } from 'mongoose';
import { StayDocument } from './schemas/stay.schema';
import { RoomDocument } from './schemas/room.schema';
import { StaySearchDto } from './dto/stays.dto';
export declare class StaysService {
    private stayModel;
    private roomModel;
    constructor(stayModel: Model<StayDocument>, roomModel: Model<RoomDocument>);
    createStay(createDto: any): Promise<StayDocument>;
    search(query: StaySearchDto): Promise<StayDocument[]>;
    getStayById(id: string): Promise<StayDocument>;
    addRoom(stayId: string, createRoomDto: any): Promise<RoomDocument>;
    getRooms(stayId: string): Promise<RoomDocument[]>;
    getRoomById(id: string): Promise<RoomDocument>;
    updateRoomAvailability(roomId: string, quantityChange: number): Promise<void>;
}
