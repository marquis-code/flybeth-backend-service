// src/modules/chat/chat.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(
        @InjectModel(ChatMessage.name) private chatModel: Model<ChatMessageDocument>,
    ) { }

    async saveMessage(
        senderId: string,
        content: string,
        roomId?: string,
        receiverId?: string,
    ): Promise<ChatMessageDocument> {
        const message = new this.chatModel({
            sender: new Types.ObjectId(senderId),
            content,
            roomId,
            receiver: receiverId ? new Types.ObjectId(receiverId) : undefined,
        });
        return message.save();
    }

    async getMessages(roomId: string, limit: number = 50): Promise<ChatMessageDocument[]> {
        return this.chatModel
            .find({ roomId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('sender', 'firstName lastName email role')
            .exec();
    }

    async markAsRead(roomId: string, userId: string): Promise<void> {
        // Mark messages not sent by the user as read
        await this.chatModel.updateMany(
            { roomId, sender: { $ne: new Types.ObjectId(userId) }, isRead: false },
            { isRead: true },
        );
    }

    async getRecentChats(userId: string): Promise<any[]> {
        // Find rooms where the user has participated
        const userObjectId = new Types.ObjectId(userId);
        return this.chatModel.aggregate([
            {
                $match: {
                    $or: [{ sender: userObjectId }, { receiver: userObjectId }]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: "$roomId",
                    lastMessage: { $first: "$content" },
                    lastMessageAt: { $first: "$createdAt" },
                    unreadCount: {
                        $sum: {
                            $cond: [{ $and: [{ $ne: ["$sender", userObjectId] }, { $eq: ["$isRead", false] }] }, 1, 0]
                        }
                    }
                }
            }
        ]).exec();
    }
}
