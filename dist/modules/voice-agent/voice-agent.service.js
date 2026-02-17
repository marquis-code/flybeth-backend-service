"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var VoiceAgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceAgentService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const voice_session_schema_1 = require("./schemas/voice-session.schema");
const roles_constant_1 = require("../../common/constants/roles.constant");
const assemblyai_service_1 = require("./services/assemblyai.service");
const ai_engine_service_1 = require("./services/ai-engine.service");
const booking_flow_service_1 = require("./services/booking-flow.service");
const ai_support_service_1 = require("./services/ai-support.service");
let VoiceAgentService = VoiceAgentService_1 = class VoiceAgentService {
    constructor(sessionModel, assemblyService, aiEngine, bookingFlow, aiSupport) {
        this.sessionModel = sessionModel;
        this.assemblyService = assemblyService;
        this.aiEngine = aiEngine;
        this.bookingFlow = bookingFlow;
        this.aiSupport = aiSupport;
        this.logger = new common_1.Logger(VoiceAgentService_1.name);
    }
    async startSession(userId, dto) {
        const session = new this.sessionModel({
            user: new mongoose_2.Types.ObjectId(userId),
            status: roles_constant_1.VoiceSessionStatus.ACTIVE,
            metadata: dto.metadata || {},
            language: dto.language || 'en',
            lastInteractionAt: new Date(),
        });
        const draft = await this.bookingFlow.getOrCreateDraft(userId, session._id.toString());
        if (draft) {
            session.bookingDraft = draft._id;
            session.currentStep = draft.currentStep;
            const { contextSummary } = await this.bookingFlow.resumeFlow(draft._id.toString());
            session.conversationHistory.push({
                role: roles_constant_1.ConversationRole.ASSISTANT,
                content: contextSummary,
                timestamp: new Date(),
            });
        }
        else {
            session.conversationHistory.push({
                role: roles_constant_1.ConversationRole.ASSISTANT,
                content: 'Hi! I\'m FlyBeth. I can help you book flights, hotels, and more. What would you like to do today?',
                timestamp: new Date(),
            });
        }
        const tokenData = await this.assemblyService.generateStreamingToken();
        session.streamingToken = tokenData.token;
        return session.save();
    }
    async getSession(id) {
        const session = await this.sessionModel.findById(id).exec();
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        return session;
    }
    async endSession(id) {
        return this.sessionModel.findByIdAndUpdate(id, {
            status: roles_constant_1.VoiceSessionStatus.COMPLETED,
            endedAt: new Date(),
        }, { new: true }).exec();
    }
    async processTextInput(id, dto) {
        const session = await this.getSession(id);
        if (session.status !== roles_constant_1.VoiceSessionStatus.ACTIVE) {
            throw new Error('Session is not active');
        }
        session.conversationHistory.push({
            role: roles_constant_1.ConversationRole.USER,
            content: dto.text,
            timestamp: new Date(),
        });
        session.lastInteractionAt = new Date();
        session.totalInteractions += 1;
        const parsed = await this.aiEngine.parseIntent(dto.text, session.conversationHistory);
        const intent = parsed.intent;
        let responseText = '';
        let stepResult = null;
        if (this.isBookingIntent(intent)) {
            let draft = session.bookingDraft
                ? await this.bookingFlow.getDraft(session.bookingDraft.toString())
                : await this.bookingFlow.startFlow(session.user.toString(), session._id.toString());
            if (!session.bookingDraft) {
                session.bookingDraft = draft._id;
                await session.save();
            }
            const result = await this.bookingFlow.processStep(draft._id.toString(), intent, parsed.entities);
            stepResult = result;
            responseText = stepResult.message;
            if (!stepResult.message.includes('confirmed')) {
                responseText = await this.aiEngine.generateResponse(intent, {
                    ...stepResult,
                    entities: parsed.entities,
                    rawText: dto.text,
                }, session.conversationHistory);
            }
            session.currentStep = stepResult.nextStep;
        }
        else if (intent === roles_constant_1.VoiceAgentIntent.CHECK_STATUS) {
            responseText = await this.aiEngine.generateResponse(intent, {
                rawText: dto.text,
                booking: { pnr: 'SAMPLE', status: 'CONFIRMED' },
            }, session.conversationHistory);
        }
        else if (intent === roles_constant_1.VoiceAgentIntent.GET_RECOMMENDATIONS) {
            responseText = await this.aiEngine.getRecommendations(session.user.toString(), []);
        }
        else if (intent === roles_constant_1.VoiceAgentIntent.GET_HELP || intent === roles_constant_1.VoiceAgentIntent.GENERAL_QUERY) {
            const supportResult = await this.aiSupport.handleSupportQuery(session.user.toString(), dto.text, { history: session.conversationHistory });
            responseText = supportResult.answer;
        }
        else {
            responseText = await this.aiEngine.generateResponse(intent, {
                rawText: dto.text,
            }, session.conversationHistory);
        }
        session.conversationHistory.push({
            role: roles_constant_1.ConversationRole.ASSISTANT,
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
    async processAudioInput(id, audioBuffer) {
        const audioUrl = await this.assemblyService.uploadAudio(audioBuffer);
        const transcription = await this.assemblyService.transcribeAndWait(audioUrl);
        return this.processTextInput(id, {
            text: transcription.text,
            context: { confidence: transcription.confidence },
        });
    }
    isBookingIntent(intent) {
        return [
            roles_constant_1.VoiceAgentIntent.SEARCH_FLIGHT,
            roles_constant_1.VoiceAgentIntent.SEARCH_STAY,
            roles_constant_1.VoiceAgentIntent.SEARCH_CAR,
            roles_constant_1.VoiceAgentIntent.SELECT_OPTION,
            roles_constant_1.VoiceAgentIntent.ADD_PASSENGER,
            roles_constant_1.VoiceAgentIntent.SET_CONTACT,
            roles_constant_1.VoiceAgentIntent.CONFIRM_BOOKING,
            roles_constant_1.VoiceAgentIntent.SEARCH_PACKAGE,
        ].includes(intent);
    }
};
exports.VoiceAgentService = VoiceAgentService;
exports.VoiceAgentService = VoiceAgentService = VoiceAgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(voice_session_schema_1.VoiceSession.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        assemblyai_service_1.AssemblyAIService,
        ai_engine_service_1.AIEngineService,
        booking_flow_service_1.BookingFlowService,
        ai_support_service_1.AISupportService])
], VoiceAgentService);
//# sourceMappingURL=voice-agent.service.js.map