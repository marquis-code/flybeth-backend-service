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
var VoiceAgentController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceAgentController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../modules/auth/guards/jwt-auth.guard");
const voice_agent_service_1 = require("./voice-agent.service");
const voice_agent_dto_1 = require("./dto/voice-agent.dto");
let VoiceAgentController = VoiceAgentController_1 = class VoiceAgentController {
    constructor(voiceAgentService) {
        this.voiceAgentService = voiceAgentService;
        this.logger = new common_1.Logger(VoiceAgentController_1.name);
    }
    async startSession(req, dto) {
        return this.voiceAgentService.startSession(req.user.userId, dto);
    }
    async getSession(id) {
        return this.voiceAgentService.getSession(id);
    }
    async processText(id, dto) {
        return this.voiceAgentService.processTextInput(id, dto);
    }
    async processAudio(id, file) {
        return this.voiceAgentService.processAudioInput(id, file.buffer);
    }
    async resumeSession(id, dto) {
        return this.voiceAgentService.startSession(id, {});
    }
    async endSession(id) {
        return this.voiceAgentService.endSession(id);
    }
    async getStreamingToken() {
        const session = await this.voiceAgentService.startSession('anonymous', {});
        return { token: session.streamingToken };
    }
};
exports.VoiceAgentController = VoiceAgentController;
__decorate([
    (0, common_1.Post)('session'),
    (0, swagger_1.ApiOperation)({ summary: 'Start a new voice session' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, voice_agent_dto_1.StartSessionDto]),
    __metadata("design:returntype", Promise)
], VoiceAgentController.prototype, "startSession", null);
__decorate([
    (0, common_1.Get)('session/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get session status' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VoiceAgentController.prototype, "getSession", null);
__decorate([
    (0, common_1.Post)('session/:id/text'),
    (0, swagger_1.ApiOperation)({ summary: 'Process text input for a session' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, voice_agent_dto_1.ProcessTextDto]),
    __metadata("design:returntype", Promise)
], VoiceAgentController.prototype, "processText", null);
__decorate([
    (0, common_1.Post)('session/:id/audio'),
    (0, swagger_1.ApiOperation)({ summary: 'Process audio input for a session' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VoiceAgentController.prototype, "processAudio", null);
__decorate([
    (0, common_1.Post)('session/:id/resume'),
    (0, swagger_1.ApiOperation)({ summary: 'Resume a paused session' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, voice_agent_dto_1.ResumeSessionDto]),
    __metadata("design:returntype", Promise)
], VoiceAgentController.prototype, "resumeSession", null);
__decorate([
    (0, common_1.Delete)('session/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'End a session' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VoiceAgentController.prototype, "endSession", null);
__decorate([
    (0, common_1.Get)('streaming-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AssemblyAI streaming token' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VoiceAgentController.prototype, "getStreamingToken", null);
exports.VoiceAgentController = VoiceAgentController = VoiceAgentController_1 = __decorate([
    (0, swagger_1.ApiTags)('Voice Agent'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('voice-agent'),
    __metadata("design:paramtypes", [voice_agent_service_1.VoiceAgentService])
], VoiceAgentController);
//# sourceMappingURL=voice-agent.controller.js.map