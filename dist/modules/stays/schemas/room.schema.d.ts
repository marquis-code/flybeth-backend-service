import { Document, Types } from 'mongoose';
export type RoomDocument = Room & Document;
export declare class Room {
    stay: Types.ObjectId;
    name: string;
    description: string;
    pricePerNight: number;
    capacity: number;
    images: string[];
    amenities: string[];
    quantity: number;
}
export declare const RoomSchema: import("mongoose").Schema<Room, import("mongoose").Model<Room, any, any, any, Document<unknown, any, Room, any, {}> & Room & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Room, Document<unknown, {}, import("mongoose").FlatRecord<Room>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Room> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
