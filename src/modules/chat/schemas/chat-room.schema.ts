import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ChatRoomDocument = ChatRoom & Document;

@Schema({ timestamps: true })
export class ChatRoom {
  @Prop({ type: [{ type: Types.ObjectId, ref: "User" }], default: [] })
  participants: Types.ObjectId[];

  @Prop({ enum: ["direct", "group", "support"], default: "direct" })
  type: string;

  @Prop()
  name?: string;

  @Prop({ type: Types.ObjectId, ref: "ChatMessage" })
  lastMessage?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Tenant" })
  tenant?: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;

  @Prop({ enum: ["open", "closed", "bot_handling", "agent_handling"], default: "open" })
  status: string;

  @Prop({ type: Types.ObjectId, ref: "User" })
  assignedAgent?: Types.ObjectId;
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
ChatRoomSchema.index({ participants: 1 });
ChatRoomSchema.index({ "metadata.guestEmail": 1 });
ChatRoomSchema.index({ status: 1 });
ChatRoomSchema.index({ type: 1, status: 1 });
