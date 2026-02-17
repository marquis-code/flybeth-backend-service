import { Model } from 'mongoose';
import { AssemblyAIService } from './assemblyai.service';
import { VoiceAgentIntent, ConversationRole } from '../../../common/constants/roles.constant';
import { BookingDraftDocument } from '../schemas/booking-draft.schema';
interface ParsedIntent {
    intent: VoiceAgentIntent;
    confidence: number;
    entities: {
        origin?: string;
        destination?: string;
        departureDate?: string;
        returnDate?: string;
        passengers?: number;
        travelClass?: string;
        bookingRef?: string;
        [key: string]: any;
    };
    rawText: string;
}
interface ConversationEntry {
    role: ConversationRole;
    content: string;
}
export declare class AIEngineService {
    private assemblyAIService;
    private draftModel;
    private readonly logger;
    private readonly SYSTEM_PROMPT;
    private readonly INTENT_PARSE_PROMPT;
    constructor(assemblyAIService: AssemblyAIService, draftModel: Model<BookingDraftDocument>);
    parseIntent(text: string, conversationHistory?: ConversationEntry[]): Promise<ParsedIntent>;
    generateResponse(intent: VoiceAgentIntent, data: Record<string, any>, conversationHistory?: ConversationEntry[]): Promise<string>;
    getRecommendations(userId: string, searchHistory?: Record<string, any>[], currentDraft?: BookingDraftDocument): Promise<string>;
    handleSupportQuery(query: string, context: {
        userId: string;
        bookingData?: any;
        conversationHistory?: ConversationEntry[];
    }): Promise<{
        answer: string;
        needsEscalation: boolean;
        category: string;
    }>;
    analyzeDisruption(flightStatus: Record<string, any>, bookingData: Record<string, any>): Promise<{
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        suggestions: string[];
    }>;
    private buildContextMessage;
    private getFallbackResponse;
}
export {};
