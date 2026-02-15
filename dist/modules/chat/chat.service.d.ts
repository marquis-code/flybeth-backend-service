import { Model } from 'mongoose';
import { ChatMessageDocument } from './schemas/chat-message.schema';
export declare class ChatService {
    private chatModel;
    private readonly logger;
    constructor(chatModel: Model<ChatMessageDocument>);
    saveMessage(senderId: string, content: string, roomId?: string, receiverId?: string): Promise<ChatMessageDocument>;
    getMessages(roomId: string, limit?: number): Promise<ChatMessageDocument[]>;
    markAsRead(roomId: string, userId: string): Promise<void>;
    getRecentChats(userId: string): Promise<any[]>;
}
