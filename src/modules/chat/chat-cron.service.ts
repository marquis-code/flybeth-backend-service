import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatRoom, ChatRoomDocument } from './schemas/chat-room.schema';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatCronService {
  private readonly logger = new Logger(ChatCronService.name);

  constructor(
    @InjectModel(ChatRoom.name) private roomModel: Model<ChatRoomDocument>,
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleInactiveChats() {
    const now = new Date();
    const warningThreshold = new Date(now.getTime() - 10 * 60000); // 10 mins
    const closeThreshold = new Date(now.getTime() - 15 * 60000);   // 15 mins

    // 1. Send warning to inactive chats
    const inactiveToWarn = await this.roomModel.find({
      type: 'support',
      status: { $in: ['open', 'bot_handling', 'agent_handling'] },
      updatedAt: { $lte: warningThreshold },
      'metadata.inactivityWarningSent': { $ne: true }
    });

    for (const room of inactiveToWarn) {
      await this.chatService.saveBotMessage(
        room.id,
        "Are you still there? Please let us know if your issue has been resolved or if you still need help. If we don't hear from you, this chat will be automatically closed soon."
      );
      
      await this.roomModel.findByIdAndUpdate(room.id, {
        $set: { 'metadata.inactivityWarningSent': true }
      });
      
      this.logger.debug(`Sent inactivity warning for room ${room.id}`);
      this.chatGateway.server.to(room.id).emit('newMessage', { content: 'warning sent' }); // trigger refresh if needed
    }

    // 2. Auto-close completely inactive chats
    const inactiveToClose = await this.roomModel.find({
      type: 'support',
      status: { $in: ['open', 'bot_handling', 'agent_handling'] },
      updatedAt: { $lte: closeThreshold },
      'metadata.inactivityWarningSent': true
    });

    for (const room of inactiveToClose) {
      await this.chatService.resolveChat(room.id);
      this.logger.debug(`Auto-resolved chat room ${room.id} due to inactivity`);
      
      await this.chatService.saveBotMessage(
        room.id,
        `This chat has been automatically resolved due to inactivity. Your ticket number is ${room.ticketNumber}. Have a great day!`
      );
      this.chatGateway.server.to(room.id).emit('roomResolved', { ticketNumber: room.ticketNumber });
    }
  }
}
