// src/modules/voice-agent/voice-agent.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VoiceSession, VoiceSessionDocument } from './schemas/voice-session.schema';
import { VoiceSessionStatus, ConversationRole, VoiceAgentIntent } from '../../common/constants/roles.constant';
import { AssemblyAIService } from './services/assemblyai.service';
import { AIEngineService } from './services/ai-engine.service';
import { BookingFlowService } from './services/booking-flow.service';
import { AISupportService } from './services/ai-support.service';
import { StartSessionDto, ProcessTextDto } from './dto/voice-agent.dto';

@Injectable()
export class VoiceAgentService {
    private readonly logger = new Logger(VoiceAgentService.name);

    constructor(
        @InjectModel(VoiceSession.name) private sessionModel: Model<VoiceSessionDocument>,
        private assemblyService: AssemblyAIService,
        private aiEngine: AIEngineService,
        private bookingFlow: BookingFlowService,
        private aiSupport: AISupportService,
    ) { }

    // ═══════════════════════ Session Management ═══════════════════════

    async startSession(userId: string, dto: StartSessionDto): Promise<VoiceSessionDocument> {
        // Create new session
        const session = new this.sessionModel({
            user: new Types.ObjectId(userId),
            status: VoiceSessionStatus.ACTIVE,
            metadata: dto.metadata || {},
            language: dto.language || 'en',
            lastInteractionAt: new Date(),
        });

        // Check for active draft to resume
        const draft = await this.bookingFlow.getOrCreateDraft(userId, session._id.toString());
        if (draft) {
            session.bookingDraft = draft._id;
            session.currentStep = draft.currentStep;

            // Add resumption message
            const { contextSummary } = await this.bookingFlow.resumeFlow(draft._id.toString());
            session.conversationHistory.push({
                role: ConversationRole.ASSISTANT,
                content: contextSummary,
                timestamp: new Date(),
            });
        } else {
            // Greeting
            session.conversationHistory.push({
                role: ConversationRole.ASSISTANT,
                content: 'Hi! I\'m FlyBeth. I can help you book flights, hotels, and more. What would you like to do today?',
                timestamp: new Date(),
            });
        }

        // Generate streaming token for frontend
        const tokenData = await this.assemblyService.generateStreamingToken();
        session.streamingToken = tokenData.token;

        return session.save();
    }

    async getSession(id: string): Promise<VoiceSessionDocument> {
        const session = await this.sessionModel.findById(id).exec();
        if (!session) throw new NotFoundException('Session not found');
        return session;
    }

    async endSession(id: string): Promise<VoiceSessionDocument> {
        return this.sessionModel.findByIdAndUpdate(
            id,
            {
                status: VoiceSessionStatus.COMPLETED,
                endedAt: new Date(),
            },
            { new: true },
        ).exec() as Promise<VoiceSessionDocument>;
    }

    // ═══════════════════════ Input Processing ═══════════════════════

    async processTextInput(id: string, dto: ProcessTextDto): Promise<{
        response: string;
        intent: string;
        session: VoiceSessionDocument;
    }> {
        const session = await this.getSession(id);
        if (session.status !== VoiceSessionStatus.ACTIVE) {
            throw new Error('Session is not active');
        }

        // Add user message
        session.conversationHistory.push({
            role: ConversationRole.USER,
            content: dto.text,
            timestamp: new Date(),
        });
        session.lastInteractionAt = new Date();
        session.totalInteractions += 1;

        // Parse intent
        const parsed = await this.aiEngine.parseIntent(dto.text, session.conversationHistory);
        const intent = parsed.intent;

        let responseText = '';
        let stepResult: {
            draft: any;
            results?: any;
            nextStep: any;
            message: string;
        } | null = null;

        // Route based on intent
        if (this.isBookingIntent(intent)) {
            // Ensure draft exists
            let draft = session.bookingDraft
                ? await this.bookingFlow.getDraft(session.bookingDraft.toString())
                : await this.bookingFlow.startFlow(session.user.toString(), session._id.toString());

            // Link draft if new
            if (!session.bookingDraft) {
                session.bookingDraft = draft._id;
                await session.save();
            }

            // Execute booking step
            const result = await this.bookingFlow.processStep(
                draft._id.toString(),
                intent,
                parsed.entities,
            );
            stepResult = result;
            responseText = stepResult.message;

            // Generate AI variation for variety
            if (!stepResult.message.includes('confirmed')) {
                responseText = await this.aiEngine.generateResponse(intent, {
                    ...stepResult,
                    entities: parsed.entities,
                    rawText: dto.text,
                }, session.conversationHistory);
            }

            // Sync session step
            session.currentStep = stepResult.nextStep;

        } else if (intent === VoiceAgentIntent.CHECK_STATUS) {
            // Check status logic
            responseText = await this.aiEngine.generateResponse(intent, {
                rawText: dto.text,
                booking: { pnr: 'SAMPLE', status: 'CONFIRMED' }, // Mock for now
            }, session.conversationHistory);

        } else if (intent === VoiceAgentIntent.GET_RECOMMENDATIONS) {
            // Recommendations
            responseText = await this.aiEngine.getRecommendations(
                session.user.toString(),
                [], // search history would be fetched here
            );

        } else if (intent === VoiceAgentIntent.GET_HELP || intent === VoiceAgentIntent.GENERAL_QUERY) {
            // Support query
            const supportResult = await this.aiSupport.handleSupportQuery(
                session.user.toString(),
                dto.text,
                { history: session.conversationHistory },
            );
            responseText = supportResult.answer;

        } else {
            // General fallback
            responseText = await this.aiEngine.generateResponse(intent, {
                rawText: dto.text,
            }, session.conversationHistory);
        }

        // Add assistant response
        session.conversationHistory.push({
            role: ConversationRole.ASSISTANT,
            content: responseText,
            timestamp: new Date(),
            intent: intent,
        });

        await session.save();

        return {
            response: responseText,
            intent: intent,
            session,
        };
    }

    async processAudioInput(id: string, audioBuffer: Buffer): Promise<any> {
        // Upload audio
        const audioUrl = await this.assemblyService.uploadAudio(audioBuffer);

        // Transcribe
        const transcription = await this.assemblyService.transcribeAndWait(audioUrl);

        // Process as text
        return this.processTextInput(id, {
            text: transcription.text,
            context: { confidence: transcription.confidence },
        });
    }

    // ═══════════════════════ Helpers ═══════════════════════

    private isBookingIntent(intent: VoiceAgentIntent): boolean {
        return [
            VoiceAgentIntent.SEARCH_FLIGHT,
            VoiceAgentIntent.SEARCH_STAY,
            VoiceAgentIntent.SEARCH_CAR,
            VoiceAgentIntent.SELECT_OPTION,
            VoiceAgentIntent.ADD_PASSENGER,
            VoiceAgentIntent.SET_CONTACT,
            VoiceAgentIntent.CONFIRM_BOOKING,
            VoiceAgentIntent.SEARCH_PACKAGE,
        ].includes(intent);
    }
}
