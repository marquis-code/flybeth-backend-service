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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AssemblyAIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssemblyAIService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let AssemblyAIService = AssemblyAIService_1 = class AssemblyAIService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(AssemblyAIService_1.name);
        const apiKey = this.configService.get('ASSEMBLYAI_API_KEY');
        const baseUrl = this.configService.get('ASSEMBLYAI_BASE_URL', 'https://api.assemblyai.com');
        const llmUrl = this.configService.get('ASSEMBLYAI_LLM_URL', 'https://llm-gateway.assemblyai.com');
        this.streamingBaseUrl = this.configService.get('ASSEMBLYAI_STREAMING_URL', 'https://streaming.assemblyai.com');
        this.client = axios_1.default.create({
            baseURL: baseUrl,
            headers: { authorization: apiKey },
        });
        this.llmClient = axios_1.default.create({
            baseURL: llmUrl,
            headers: {
                authorization: apiKey,
                'Content-Type': 'application/json',
            },
        });
    }
    async uploadAudio(audioBuffer) {
        try {
            const response = await this.client.post('/v2/upload', audioBuffer, {
                headers: { 'Content-Type': 'application/octet-stream' },
            });
            this.logger.log(`Audio uploaded: ${response.data.upload_url}`);
            return response.data.upload_url;
        }
        catch (error) {
            this.logger.error(`Audio upload failed: ${error.message}`);
            throw error;
        }
    }
    async transcribeAudio(audioUrl, options = {}) {
        try {
            const data = {
                audio_url: audioUrl,
                language_detection: true,
                speech_models: ['universal-3-pro', 'universal-2'],
                punctuate: true,
                format_text: true,
                ...options,
            };
            const response = await this.client.post('/v2/transcript', data);
            const transcriptId = response.data.id;
            this.logger.log(`Transcription started: ${transcriptId}`);
            return transcriptId;
        }
        catch (error) {
            this.logger.error(`Transcription request failed: ${error.message}`);
            throw error;
        }
    }
    async getTranscription(transcriptId) {
        try {
            const response = await this.client.get(`/v2/transcript/${transcriptId}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Get transcription failed: ${error.message}`);
            throw error;
        }
    }
    async waitForTranscription(transcriptId, maxWaitMs = 120000) {
        const startTime = Date.now();
        const pollInterval = 3000;
        while (Date.now() - startTime < maxWaitMs) {
            const result = await this.getTranscription(transcriptId);
            if (result.status === 'completed') {
                this.logger.log(`Transcription completed: ${transcriptId}`);
                return result;
            }
            if (result.status === 'error') {
                throw new Error(`Transcription failed: ${result.error}`);
            }
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
        throw new Error(`Transcription timed out after ${maxWaitMs}ms`);
    }
    async transcribeAndWait(audioUrl, options = {}) {
        const transcriptId = await this.transcribeAudio(audioUrl, options);
        const result = await this.waitForTranscription(transcriptId);
        return {
            text: result.text,
            confidence: result.confidence,
            words: result.words || [],
            language_code: result.language_code,
        };
    }
    async generateStreamingToken(expiresInSeconds = 3600) {
        try {
            const response = await axios_1.default.get(`${this.streamingBaseUrl}/v3/token`, {
                headers: {
                    authorization: this.configService.get('ASSEMBLYAI_API_KEY'),
                },
                params: { expires_in_seconds: expiresInSeconds },
            });
            this.logger.log('Streaming token generated');
            return response.data;
        }
        catch (error) {
            this.logger.error(`Streaming token generation failed: ${error.message}`);
            throw error;
        }
    }
    async chatCompletion(messages, options = {}) {
        try {
            const payload = {
                model: options.model || 'claude-sonnet-4-5-20250929',
                messages,
                max_tokens: options.maxTokens || 1024,
                temperature: options.temperature ?? 0.7,
            };
            const response = await this.llmClient.post('/v1/chat/completions', payload);
            const choice = response.data.choices?.[0];
            return {
                content: choice?.message?.content || '',
                usage: response.data.usage,
            };
        }
        catch (error) {
            this.logger.error(`LLM chat completion failed: ${error.message}`);
            throw error;
        }
    }
    async processSpeechUnderstanding(transcriptId, request) {
        try {
            const response = await this.llmClient.post('/v1/understanding', {
                transcript_id: transcriptId,
                speech_understanding: { request },
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Speech understanding failed: ${error.message}`);
            throw error;
        }
    }
    async searchWords(transcriptId, words) {
        try {
            const response = await this.client.get(`/v2/transcript/${transcriptId}/word-search`, { params: { words: words.join(',') } });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Word search failed: ${error.message}`);
            throw error;
        }
    }
};
exports.AssemblyAIService = AssemblyAIService;
exports.AssemblyAIService = AssemblyAIService = AssemblyAIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AssemblyAIService);
//# sourceMappingURL=assemblyai.service.js.map