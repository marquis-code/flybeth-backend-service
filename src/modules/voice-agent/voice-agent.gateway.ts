// src/modules/voice-agent/voice-agent.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AssemblyAIService } from './services/assemblyai.service';
import { VoiceAgentService } from './voice-agent.service';
import { ProcessTextDto } from './dto/voice-agent.dto';

interface AuthenticatedSocket extends Socket {
    user: any;
}

@WebSocketGateway({
    namespace: 'voice-agent',
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})
export class VoiceAgentGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(VoiceAgentGateway.name);

    constructor(
        private jwtService: JwtService,
        private assemblyService: AssemblyAIService,
        private voiceAgentService: VoiceAgentService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization;
            if (!token) {
                client.disconnect();
                return;
            }

            const cleanToken = token.replace('Bearer ', '');
            const payload = this.jwtService.verify(cleanToken);
            (client as any).user = payload;

            const userId = payload.sub || payload.userId;
            await client.join(`user:${userId}`);

            this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
        } catch (error) {
            this.logger.error(`Connection auth failed: ${error.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('startVoiceStream')
    async handleStartVoiceStream(@ConnectedSocket() client: AuthenticatedSocket) {
        const userId = client.user.sub || client.user.userId;

        // Start session + get token
        const session = await this.voiceAgentService.startSession(userId, {});

        // Return token to client so they can connect directly to AssemblyAI websocket
        // Or stream audio through here if needed (direct is better for latency)
        return {
            event: 'voiceStreamStarted',
            data: {
                sessionId: session._id,
                streamingToken: session.streamingToken,
                assemblyAiUrl: `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${session.streamingToken}`,
            },
        };
    }

    @SubscribeMessage('textInput')
    async handleTextInput(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() payload: { text: string; sessionId: string },
    ) {
        const result = await this.voiceAgentService.processTextInput(
            payload.sessionId,
            { text: payload.text } as ProcessTextDto,
        );

        return {
            event: 'aiResponse',
            data: {
                text: result.response,
                intent: result.intent,
                step: result.session.currentStep,
            },
        };
    }

    @SubscribeMessage('audioChunk')
    async handleAudioChunk(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() payload: { chunk: Buffer; sessionId: string },
    ) {
        // In a real-world scenario, we'd stream this to AssemblyAI
        // However, the recommended pattern is for the client to connect directly to AssemblyAI
        // using the temporary token we generated, to minimize latency.
        // This handler is a fallback if direct connection isn't possible.

        // Placeholder for server-side relay
        this.logger.warn('Received audio chunk on server (recommend client-side streaming)');
    }
}
