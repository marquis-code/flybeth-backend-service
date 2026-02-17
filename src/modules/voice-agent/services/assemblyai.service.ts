// src/modules/voice-agent/services/assemblyai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class AssemblyAIService {
    private readonly logger = new Logger(AssemblyAIService.name);
    private readonly client: AxiosInstance;
    private readonly llmClient: AxiosInstance;
    private readonly streamingBaseUrl: string;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('ASSEMBLYAI_API_KEY');
        const baseUrl = this.configService.get<string>(
            'ASSEMBLYAI_BASE_URL',
            'https://api.assemblyai.com',
        );
        const llmUrl = this.configService.get<string>(
            'ASSEMBLYAI_LLM_URL',
            'https://llm-gateway.assemblyai.com',
        );
        this.streamingBaseUrl = this.configService.get<string>(
            'ASSEMBLYAI_STREAMING_URL',
            'https://streaming.assemblyai.com',
        );

        this.client = axios.create({
            baseURL: baseUrl,
            headers: { authorization: apiKey },
        });

        this.llmClient = axios.create({
            baseURL: llmUrl,
            headers: {
                authorization: apiKey,
                'Content-Type': 'application/json',
            },
        });
    }

    // ═══════════════════════ Audio Upload ═══════════════════════

    async uploadAudio(audioBuffer: Buffer): Promise<string> {
        try {
            const response = await this.client.post('/v2/upload', audioBuffer, {
                headers: { 'Content-Type': 'application/octet-stream' },
            });
            this.logger.log(`Audio uploaded: ${response.data.upload_url}`);
            return response.data.upload_url;
        } catch (error) {
            this.logger.error(`Audio upload failed: ${error.message}`);
            throw error;
        }
    }

    // ═══════════════════════ Transcription ═══════════════════════

    async transcribeAudio(
        audioUrl: string,
        options: Record<string, any> = {},
    ): Promise<string> {
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
        } catch (error) {
            this.logger.error(`Transcription request failed: ${error.message}`);
            throw error;
        }
    }

    async getTranscription(transcriptId: string): Promise<any> {
        try {
            const response = await this.client.get(`/v2/transcript/${transcriptId}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Get transcription failed: ${error.message}`);
            throw error;
        }
    }

    async waitForTranscription(
        transcriptId: string,
        maxWaitMs: number = 120000,
    ): Promise<any> {
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

    async transcribeAndWait(
        audioUrl: string,
        options: Record<string, any> = {},
    ): Promise<{ text: string; confidence: number; words: any[]; language_code: string }> {
        const transcriptId = await this.transcribeAudio(audioUrl, options);
        const result = await this.waitForTranscription(transcriptId);
        return {
            text: result.text,
            confidence: result.confidence,
            words: result.words || [],
            language_code: result.language_code,
        };
    }

    // ═══════════════════════ Streaming Token ═══════════════════════

    async generateStreamingToken(expiresInSeconds: number = 3600): Promise<{
        token: string;
        expires_in_seconds: number;
    }> {
        try {
            const response = await axios.get(`${this.streamingBaseUrl}/v3/token`, {
                headers: {
                    authorization: this.configService.get<string>('ASSEMBLYAI_API_KEY'),
                },
                params: { expires_in_seconds: expiresInSeconds },
            });
            this.logger.log('Streaming token generated');
            return response.data;
        } catch (error) {
            this.logger.error(`Streaming token generation failed: ${error.message}`);
            throw error;
        }
    }

    // ═══════════════════════ LLM Chat Completions ═══════════════════════

    async chatCompletion(
        messages: Array<{ role: string; content: string }>,
        options: {
            model?: string;
            maxTokens?: number;
            temperature?: number;
        } = {},
    ): Promise<{ content: string; usage: any }> {
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
        } catch (error) {
            this.logger.error(`LLM chat completion failed: ${error.message}`);
            throw error;
        }
    }

    // ═══════════════════════ Speech Understanding ═══════════════════════

    async processSpeechUnderstanding(
        transcriptId: string,
        request: Record<string, any>,
    ): Promise<any> {
        try {
            const response = await this.llmClient.post('/v1/understanding', {
                transcript_id: transcriptId,
                speech_understanding: { request },
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Speech understanding failed: ${error.message}`);
            throw error;
        }
    }

    // ═══════════════════════ Word Search ═══════════════════════

    async searchWords(
        transcriptId: string,
        words: string[],
    ): Promise<any> {
        try {
            const response = await this.client.get(
                `/v2/transcript/${transcriptId}/word-search`,
                { params: { words: words.join(',') } },
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Word search failed: ${error.message}`);
            throw error;
        }
    }
}
