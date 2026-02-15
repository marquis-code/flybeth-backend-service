// src/modules/chat/schemas/chat-message.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ timestamps: true })
export class ChatMessage {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    sender: Types.ObjectId;

    // Receiver can be a specific user (for B2B/Support) or a room/ticket ID
    @Prop({ type: Types.ObjectId, ref: 'User' })
    receiver?: Types.ObjectId;

    @Prop({ required: true })
    content: string;

    // Room ID (e.g., BookingID or SupportTicketID)
    @Prop({ index: true })
    roomId?: string;

    @Prop({ default: false })
    isRead: boolean;

    @Prop({ type: String, enum: ['text', 'image', 'file'], default: 'text' })
    type: string;

    @Prop()
    metadata?: Record<string, any>;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
ChatMessageSchema.index({ roomId: 1, createdAt: -1 }); // Optimized for chat history
ChatMessageSchema.index({ sender: 1, receiver: 1 }); // Optimized for direct messaging
