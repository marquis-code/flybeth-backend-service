import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { ChatGateway } from "./chat.gateway";
import { AutoResponseService } from "./auto-response.service";
import { ChatCronService } from "./chat-cron.service";
import { ChatRoom, ChatRoomSchema } from "./schemas/chat-room.schema";
import { ChatMessage, ChatMessageSchema } from "./schemas/chat-message.schema";
import { Department, DepartmentSchema } from "./schemas/department.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import { JwtModule } from "@nestjs/jwt";
import { DepartmentController } from "./department.controller";
import { DepartmentService } from "./department.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatRoom.name, schema: ChatRoomSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule,
  ],
  controllers: [ChatController, DepartmentController],
  providers: [ChatService, ChatGateway, AutoResponseService, ChatCronService, DepartmentService],
  exports: [ChatService, ChatGateway, AutoResponseService, DepartmentService],
})
export class ChatModule {}
