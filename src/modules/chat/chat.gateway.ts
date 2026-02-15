// src/modules/chat/chat.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    constructor(
        private chatService: ChatService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = this.extractToken(client);
            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });

            // Attach user info to socket
            client.data.user = payload;

            // Join user to their own room (for personal notifications)
            const userId = payload.sub;
            await client.join(`user:${userId}`);

            this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
        } catch (e) {
            this.logger.error(`Connection failed: ${e.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinRoom')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() roomId: string,
    ) {
        await client.join(roomId);
        this.logger.log(`User ${client.data.user.sub} joined room ${roomId}`);
        return { event: 'joinedRoom', data: roomId };
    }

    @SubscribeMessage('leaveRoom')
    async handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() roomId: string,
    ) {
        await client.leave(roomId);
        this.logger.log(`User ${client.data.user.sub} left room ${roomId}`);
        return { event: 'leftRoom', data: roomId };
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { roomId: string; content: string; receiverId?: string },
    ) {
        const userId = client.data.user.sub;

        // Save to DB
        const message = await this.chatService.saveMessage(
            userId,
            payload.content,
            payload.roomId,
            payload.receiverId,
        );

        // Broadcast to room
        this.server.to(payload.roomId).emit('newMessage', message);

        // Also emit to specific receiver if detailed
        if (payload.receiverId) {
            this.server.to(`user:${payload.receiverId}`).emit('notification', {
                type: 'message',
                content: `New message from ${client.data.user.email}`,
                roomId: payload.roomId
            });
        }

        return message;
    }

    @SubscribeMessage('markAsRead')
    async handleMarkAsRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() roomId: string,
    ) {
        const userId = client.data.user.sub;
        await this.chatService.markAsRead(roomId, userId);
        return { status: 'success' };
    }

    private extractToken(client: Socket): string | null {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
            return authHeader.split(' ')[1];
        }
        return null;
    }
}
