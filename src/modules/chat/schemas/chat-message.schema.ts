import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ type: Types.ObjectId, ref: "ChatRoom", required: true })
  room: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: false })
  sender?: Types.ObjectId;

  @Prop({ required: false })
  senderId?: string; // For guests or non-user entities

  @Prop({ required: true })
  content: string;

  @Prop({ default: "text" })
  type: string; // text, image, file, bot_response, system

  @Prop({ type: [String], default: [] })
  readBy: string[]; // Store as strings to handle both guest and user IDs

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: "ChatMessage" })
  replyTo?: Types.ObjectId;

  @Prop({ default: false })
  isBot: boolean;

  @Prop({ default: false })
  isAutoResponse: boolean;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.index({ room: 1, createdAt: -1 });
ChatMessageSchema.index({ isBot: 1 });
