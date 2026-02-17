// src/modules/voice-agent/schemas/voice-session.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
    VoiceSessionStatus,
    ConversationRole,
} from '../../../common/constants/roles.constant';

export type VoiceSessionDocument = VoiceSession & Document;

@Schema({ _id: false })
export class ConversationMessage {
    @Prop({ enum: ConversationRole, required: true })
    role: ConversationRole;

    @Prop({ required: true })
    content: string;

    @Prop({ default: Date.now })
    timestamp: Date;

    @Prop()
    intent?: string;

    @Prop({ type: Object })
    entities?: Record<string, any>;

    @Prop()
    transcriptionId?: string;

    @Prop()
    confidence?: number;
}

@Schema({ timestamps: true, collection: 'voice_sessions' })
export class VoiceSession {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    user: Types.ObjectId;

    @Prop({ enum: VoiceSessionStatus, default: VoiceSessionStatus.ACTIVE })
    status: VoiceSessionStatus;

    @Prop({ type: [ConversationMessage], default: [] })
    conversationHistory: ConversationMessage[];

    @Prop({ default: 'search' })
    currentStep: string;

    @Prop({ type: Types.ObjectId, ref: 'BookingDraft' })
    bookingDraft?: Types.ObjectId;

    @Prop({ type: Object, default: {} })
    metadata: Record<string, any>;

    @Prop()
    language?: string;

    @Prop({ default: 0 })
    totalInteractions: number;

    @Prop()
    lastInteractionAt: Date;

    @Prop()
    endedAt?: Date;

    @Prop()
    streamingToken?: string;
}

export const VoiceSessionSchema = SchemaFactory.createForClass(VoiceSession);

// Auto-expire abandoned sessions after 2 hours
VoiceSessionSchema.index(
    { lastInteractionAt: 1 },
    { expireAfterSeconds: 7200, partialFilterExpression: { status: 'abandoned' } },
);
VoiceSessionSchema.index({ user: 1, status: 1 });
VoiceSessionSchema.index({ createdAt: -1 });
