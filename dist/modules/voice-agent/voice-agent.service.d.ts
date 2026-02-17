import { Model } from 'mongoose';
import { VoiceSessionDocument } from './schemas/voice-session.schema';
import { AssemblyAIService } from './services/assemblyai.service';
import { AIEngineService } from './services/ai-engine.service';
import { BookingFlowService } from './services/booking-flow.service';
import { AISupportService } from './services/ai-support.service';
import { StartSessionDto, ProcessTextDto } from './dto/voice-agent.dto';
export declare class VoiceAgentService {
    private sessionModel;
    private assemblyService;
    private aiEngine;
    private bookingFlow;
    private aiSupport;
    private readonly logger;
    constructor(sessionModel: Model<VoiceSessionDocument>, assemblyService: AssemblyAIService, aiEngine: AIEngineService, bookingFlow: BookingFlowService, aiSupport: AISupportService);
    startSession(userId: string, dto: StartSessionDto): Promise<VoiceSessionDocument>;
    getSession(id: string): Promise<VoiceSessionDocument>;
    endSession(id: string): Promise<VoiceSessionDocument>;
    processTextInput(id: string, dto: ProcessTextDto): Promise<{
        response: string;
        intent: string;
        session: VoiceSessionDocument;
    }>;
    processAudioInput(id: string, audioBuffer: Buffer): Promise<any>;
    private isBookingIntent;
}
