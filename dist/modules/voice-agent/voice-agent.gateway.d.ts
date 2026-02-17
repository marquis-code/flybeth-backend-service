import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AssemblyAIService } from './services/assemblyai.service';
import { VoiceAgentService } from './voice-agent.service';
interface AuthenticatedSocket extends Socket {
    user: any;
}
export declare class VoiceAgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private assemblyService;
    private voiceAgentService;
    server: Server;
    private readonly logger;
    constructor(jwtService: JwtService, assemblyService: AssemblyAIService, voiceAgentService: VoiceAgentService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleStartVoiceStream(client: AuthenticatedSocket): Promise<{
        event: string;
        data: {
            sessionId: import("mongoose").Types.ObjectId;
            streamingToken: string | undefined;
            assemblyAiUrl: string;
        };
    }>;
    handleTextInput(client: AuthenticatedSocket, payload: {
        text: string;
        sessionId: string;
    }): Promise<{
        event: string;
        data: {
            text: string;
            intent: string;
            step: string;
        };
    }>;
    handleAudioChunk(client: AuthenticatedSocket, payload: {
        chunk: Buffer;
        sessionId: string;
    }): Promise<void>;
}
export {};
