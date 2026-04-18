import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ChatRoom, ChatRoomDocument } from "./schemas/chat-room.schema";
import { ChatMessage, ChatMessageDocument } from "./schemas/chat-message.schema";
import { CreateRoomDto, SendMessageDto } from "./dto/chat.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { paginate } from "../../common/utils/pagination.util";

// Static bot user ID — used as sender for all bot messages
const BOT_USER_ID = "000000000000000000000001";

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(ChatRoom.name) private roomModel: Model<ChatRoomDocument>,
    @InjectModel(ChatMessage.name) private messageModel: Model<ChatMessageDocument>,
  ) {}

  async findOrCreateDirectRoom(user1: string, user2: string, tenantId?: string): Promise<ChatRoomDocument> {
    const participants = [user1, user2].sort().map(id => new Types.ObjectId(id));
    
    let room = await this.roomModel.findOne({
      participants: { $all: participants, $size: 2 },
      type: "direct"
    }).exec();

    if (!room) {
      room = new this.roomModel({
        participants,
        type: "direct",
        tenant: tenantId ? new Types.ObjectId(tenantId) : null
      });
      await room.save();
    }
    return room.populate("participants", "firstName lastName avatar role");
  }

  async createGroupRoom(dto: CreateRoomDto, creatorId: string, tenantId?: string): Promise<ChatRoomDocument> {
    const participants = [...new Set([...dto.participants, creatorId])].map(id => new Types.ObjectId(id));
    const room = new this.roomModel({
      participants,
      type: "group",
      name: dto.name || "New Group Chat",
      tenant: tenantId ? new Types.ObjectId(tenantId) : null
    });
    const saved = await room.save();
    return saved.populate("participants", "firstName lastName avatar role");
  }

  async saveMessage(senderId: string, dto: SendMessageDto, isBot = false, isAutoResponse = false): Promise<ChatMessageDocument> {
    const isObjectId = Types.ObjectId.isValid(senderId);
    
    const message = new this.messageModel({
      room: new Types.ObjectId(dto.roomId),
      sender: isObjectId ? new Types.ObjectId(senderId) : undefined,
      senderId: !isObjectId ? senderId : undefined,
      content: dto.content,
      type: dto.type || "text",
      metadata: dto.metadata,
      replyTo: dto.replyTo ? new Types.ObjectId(dto.replyTo) : undefined,
      readBy: [senderId],
      isBot,
      isAutoResponse,
    });

    const saved = await message.save();
    
    // Update last message in room
    await this.roomModel.findByIdAndUpdate(dto.roomId, {
      lastMessage: saved._id
    });

    return saved.populate([
      { path: "sender", select: "firstName lastName avatar role" },
      { 
        path: "replyTo",
        populate: { path: "sender", select: "firstName lastName" }
      }
    ]);
  }

  async saveBotMessage(roomId: string, content: string, metadata?: any): Promise<ChatMessageDocument> {
    return this.saveMessage(BOT_USER_ID, {
      roomId,
      content,
      type: "bot_response",
      metadata: {
        ...metadata,
        isBot: true,
        senderName: "Flybeth Bot"
      }
    }, true, true);
  }

  async getMyRooms(userId: string, paginationDto: PaginationDto) {
    const query = { participants: new Types.ObjectId(userId) };
    return paginate(
      this.roomModel,
      query,
      { ...paginationDto, sortBy: "updatedAt", sortOrder: "desc" },
      "participants lastMessage"
    );
  }

  async getRoomMessages(roomId: string, paginationDto: PaginationDto) {
    const query = { room: new Types.ObjectId(roomId) };
    return paginate(
      this.messageModel,
      query,
      { ...paginationDto, sortBy: "createdAt", sortOrder: "desc" },
      [
        { path: "sender", select: "firstName lastName avatar role" },
        { 
          path: "replyTo",
          populate: { path: "sender", select: "firstName lastName" }
        }
      ]
    );
  }

  async getAllRooms(paginationDto: PaginationDto) {
    return paginate(
      this.roomModel,
      {},
      { ...paginationDto, sortBy: "updatedAt", sortOrder: "desc" },
      "participants lastMessage"
    );
  }

  async getSupportRooms(paginationDto: PaginationDto) {
    return paginate(
      this.roomModel,
      { type: "support" },
      { ...paginationDto, sortBy: "updatedAt", sortOrder: "desc" },
      "participants lastMessage"
    );
  }

  async findOrCreateGuestSupportRoom(guestEmail: string, guestName: string, tenantId?: string): Promise<ChatRoomDocument> {
    let room = await this.roomModel.findOne({
      "metadata.guestEmail": guestEmail.toLowerCase(),
      type: "support",
      status: { $in: ["open", "bot_handling", "agent_handling"] }
    }).exec();

    if (!room) {
      room = new this.roomModel({
        type: "support",
        name: `Support: ${guestName}`,
        status: "bot_handling",
        metadata: {
           guestName,
           guestEmail: guestEmail.toLowerCase(),
           isGuestRoom: true,
           createdAt: new Date().toISOString()
        },
        tenant: tenantId ? new Types.ObjectId(tenantId) : null
      });
      await room.save();
    }
    return room;
  }

  async findOrCreateUserSupportRoom(userId: string, userName: string, userEmail: string): Promise<ChatRoomDocument> {
    let room = await this.roomModel.findOne({
      participants: new Types.ObjectId(userId),
      type: "support",
      status: { $in: ["open", "bot_handling", "agent_handling"] }
    }).exec();

    if (!room) {
      room = new this.roomModel({
        type: "support",
        name: `Support: ${userName}`,
        participants: [new Types.ObjectId(userId)],
        status: "bot_handling",
        metadata: {
           userName,
           userEmail,
           isGuestRoom: false,
           createdAt: new Date().toISOString()
        }
      });
      await room.save();
    }
    return room;
  }

  async updateRoomStatus(roomId: string, status: string, agentId?: string) {
    const update: any = { status };
    if (agentId) {
      update.assignedAgent = new Types.ObjectId(agentId);
      await this.roomModel.findByIdAndUpdate(roomId, {
        $addToSet: { participants: new Types.ObjectId(agentId) },
        ...update
      });
    } else {
      await this.roomModel.findByIdAndUpdate(roomId, update);
    }
  }

  async markAsRead(roomId: string, userId: string) {
    await this.messageModel.updateMany(
      { room: new Types.ObjectId(roomId), readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    ).exec();
  }

  async getRoomById(roomId: string): Promise<ChatRoomDocument | null> {
    return this.roomModel.findById(roomId).populate("participants", "firstName lastName avatar role").exec();
  }
}
