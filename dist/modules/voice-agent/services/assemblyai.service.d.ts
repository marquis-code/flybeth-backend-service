import { ConfigService } from '@nestjs/config';
export declare class AssemblyAIService {
    private configService;
    private readonly logger;
    private readonly client;
    private readonly llmClient;
    private readonly streamingBaseUrl;
    constructor(configService: ConfigService);
    uploadAudio(audioBuffer: Buffer): Promise<string>;
    transcribeAudio(audioUrl: string, options?: Record<string, any>): Promise<string>;
    getTranscription(transcriptId: string): Promise<any>;
    waitForTranscription(transcriptId: string, maxWaitMs?: number): Promise<any>;
    transcribeAndWait(audioUrl: string, options?: Record<string, any>): Promise<{
        text: string;
        confidence: number;
        words: any[];
        language_code: string;
    }>;
    generateStreamingToken(expiresInSeconds?: number): Promise<{
        token: string;
        expires_in_seconds: number;
    }>;
    chatCompletion(messages: Array<{
        role: string;
        content: string;
    }>, options?: {
        model?: string;
        maxTokens?: number;
        temperature?: number;
    }): Promise<{
        content: string;
        usage: any;
    }>;
    processSpeechUnderstanding(transcriptId: string, request: Record<string, any>): Promise<any>;
    searchWords(transcriptId: string, words: string[]): Promise<any>;
}
