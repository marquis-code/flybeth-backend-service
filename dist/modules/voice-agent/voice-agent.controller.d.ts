import { VoiceAgentService } from './voice-agent.service';
import { StartSessionDto, ProcessTextDto, ResumeSessionDto } from './dto/voice-agent.dto';
export declare class VoiceAgentController {
    private readonly voiceAgentService;
    private readonly logger;
    constructor(voiceAgentService: VoiceAgentService);
    startSession(req: any, dto: StartSessionDto): Promise<import("./schemas/voice-session.schema").VoiceSessionDocument>;
    getSession(id: string): Promise<import("./schemas/voice-session.schema").VoiceSessionDocument>;
    processText(id: string, dto: ProcessTextDto): Promise<{
        response: string;
        intent: string;
        session: import("./schemas/voice-session.schema").VoiceSessionDocument;
    }>;
    processAudio(id: string, file: Express.Multer.File): Promise<any>;
    resumeSession(id: string, dto: ResumeSessionDto): Promise<import("./schemas/voice-session.schema").VoiceSessionDocument>;
    endSession(id: string): Promise<import("./schemas/voice-session.schema").VoiceSessionDocument>;
    getStreamingToken(): Promise<{
        token: string | undefined;
    }>;
}
