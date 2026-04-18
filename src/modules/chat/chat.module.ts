import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { ChatGateway } from "./chat.gateway";
import { AutoResponseService } from "./auto-response.service";
import { ChatRoom, ChatRoomSchema } from "./schemas/chat-room.schema";
import { ChatMessage, ChatMessageSchema } from "./schemas/chat-message.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatRoom.name, schema: ChatRoomSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, AutoResponseService],
  exports: [ChatService, ChatGateway, AutoResponseService],
})
export class ChatModule {}
