import { Document, Types } from 'mongoose';
export type ChatMessageDocument = ChatMessage & Document;
export declare class ChatMessage {
    sender: Types.ObjectId;
    receiver?: Types.ObjectId;
    content: string;
    roomId?: string;
    isRead: boolean;
    type: string;
    metadata?: Record<string, any>;
}
export declare const ChatMessageSchema: import("mongoose").Schema<ChatMessage, import("mongoose").Model<ChatMessage, any, any, any, Document<unknown, any, ChatMessage, any, {}> & ChatMessage & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ChatMessage, Document<unknown, {}, import("mongoose").FlatRecord<ChatMessage>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ChatMessage> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
