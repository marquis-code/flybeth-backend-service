import { StaysService } from './stays.service';
import { StaySearchDto } from './dto/stays.dto';
export declare class StaysController {
    private readonly staysService;
    constructor(staysService: StaysService);
    createStay(createDto: any): Promise<import("./schemas/stay.schema").StayDocument>;
    searchStays(query: StaySearchDto): Promise<import("./schemas/stay.schema").StayDocument[]>;
    getStay(id: string): Promise<import("./schemas/stay.schema").StayDocument>;
    addRoom(id: string, createRoomDto: any): Promise<import("./schemas/room.schema").RoomDocument>;
    getRooms(id: string): Promise<import("./schemas/room.schema").RoomDocument[]>;
}
