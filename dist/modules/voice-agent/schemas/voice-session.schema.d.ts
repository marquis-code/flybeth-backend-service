import { Document, Types } from 'mongoose';
import { VoiceSessionStatus, ConversationRole } from '../../../common/constants/roles.constant';
export type VoiceSessionDocument = VoiceSession & Document;
export declare class ConversationMessage {
    role: ConversationRole;
    content: string;
    timestamp: Date;
    intent?: string;
    entities?: Record<string, any>;
    transcriptionId?: string;
    confidence?: number;
}
export declare class VoiceSession {
    user: Types.ObjectId;
    status: VoiceSessionStatus;
    conversationHistory: ConversationMessage[];
    currentStep: string;
    bookingDraft?: Types.ObjectId;
    metadata: Record<string, any>;
    language?: string;
    totalInteractions: number;
    lastInteractionAt: Date;
    endedAt?: Date;
    streamingToken?: string;
}
export declare const VoiceSessionSchema: import("mongoose").Schema<VoiceSession, import("mongoose").Model<VoiceSession, any, any, any, Document<unknown, any, VoiceSession, any, {}> & VoiceSession & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, VoiceSession, Document<unknown, {}, import("mongoose").FlatRecord<VoiceSession>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<VoiceSession> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
