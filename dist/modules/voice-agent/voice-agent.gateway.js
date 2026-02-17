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
var VoiceAgentGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceAgentGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const assemblyai_service_1 = require("./services/assemblyai.service");
const voice_agent_service_1 = require("./voice-agent.service");
let VoiceAgentGateway = VoiceAgentGateway_1 = class VoiceAgentGateway {
    constructor(jwtService, assemblyService, voiceAgentService) {
        this.jwtService = jwtService;
        this.assemblyService = assemblyService;
        this.voiceAgentService = voiceAgentService;
        this.logger = new common_1.Logger(VoiceAgentGateway_1.name);
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization;
            if (!token) {
                client.disconnect();
                return;
            }
            const cleanToken = token.replace('Bearer ', '');
            const payload = this.jwtService.verify(cleanToken);
            client.user = payload;
            const userId = payload.sub || payload.userId;
            await client.join(`user:${userId}`);
            this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
        }
        catch (error) {
            this.logger.error(`Connection auth failed: ${error.message}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    async handleStartVoiceStream(client) {
        const userId = client.user.sub || client.user.userId;
        const session = await this.voiceAgentService.startSession(userId, {});
        return {
            event: 'voiceStreamStarted',
            data: {
                sessionId: session._id,
                streamingToken: session.streamingToken,
                assemblyAiUrl: `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${session.streamingToken}`,
            },
        };
    }
    async handleTextInput(client, payload) {
        const result = await this.voiceAgentService.processTextInput(payload.sessionId, { text: payload.text });
        return {
            event: 'aiResponse',
            data: {
                text: result.response,
                intent: result.intent,
                step: result.session.currentStep,
            },
        };
    }
    async handleAudioChunk(client, payload) {
        this.logger.warn('Received audio chunk on server (recommend client-side streaming)');
    }
};
exports.VoiceAgentGateway = VoiceAgentGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], VoiceAgentGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('startVoiceStream'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoiceAgentGateway.prototype, "handleStartVoiceStream", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('textInput'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VoiceAgentGateway.prototype, "handleTextInput", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('audioChunk'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VoiceAgentGateway.prototype, "handleAudioChunk", null);
exports.VoiceAgentGateway = VoiceAgentGateway = VoiceAgentGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: 'voice-agent',
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        assemblyai_service_1.AssemblyAIService,
        voice_agent_service_1.VoiceAgentService])
], VoiceAgentGateway);
//# sourceMappingURL=voice-agent.gateway.js.map