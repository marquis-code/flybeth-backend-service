"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const chat_message_schema_1 = require("./schemas/chat-message.schema");
let ChatService = ChatService_1 = class ChatService {
    constructor(chatModel) {
        this.chatModel = chatModel;
        this.logger = new common_1.Logger(ChatService_1.name);
    }
    async saveMessage(senderId, content, roomId, receiverId) {
        const message = new this.chatModel({
            sender: new mongoose_2.Types.ObjectId(senderId),
            content,
            roomId,
            receiver: receiverId ? new mongoose_2.Types.ObjectId(receiverId) : undefined,
        });
        return message.save();
    }
    async getMessages(roomId, limit = 50) {
        return this.chatModel
            .find({ roomId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('sender', 'firstName lastName email role')
            .exec();
    }
    async markAsRead(roomId, userId) {
        await this.chatModel.updateMany({ roomId, sender: { $ne: new mongoose_2.Types.ObjectId(userId) }, isRead: false }, { isRead: true });
    }
    async getRecentChats(userId) {
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
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
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(chat_message_schema_1.ChatMessage.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ChatService);
//# sourceMappingURL=chat.service.js.map