import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private chatService;
    private jwtService;
    private configService;
    server: Server;
    private readonly logger;
    constructor(chatService: ChatService, jwtService: JwtService, configService: ConfigService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(client: Socket, roomId: string): Promise<{
        event: string;
        data: string;
    }>;
    handleLeaveRoom(client: Socket, roomId: string): Promise<{
        event: string;
        data: string;
    }>;
    handleMessage(client: Socket, payload: {
        roomId: string;
        content: string;
        receiverId?: string;
    }): Promise<import("./schemas/chat-message.schema").ChatMessageDocument>;
    handleMarkAsRead(client: Socket, roomId: string): Promise<{
        status: string;
    }>;
    private extractToken;
}
