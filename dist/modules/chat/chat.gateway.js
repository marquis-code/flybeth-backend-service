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
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    constructor(chatService, jwtService, configService) {
        this.chatService = chatService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(ChatGateway_1.name);
    }
    async handleConnection(client) {
        try {
            const token = this.extractToken(client);
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
            client.data.user = payload;
            const userId = payload.sub;
            await client.join(`user:${userId}`);
            this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
        }
        catch (e) {
            this.logger.error(`Connection failed: ${e.message}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    async handleJoinRoom(client, roomId) {
        await client.join(roomId);
        this.logger.log(`User ${client.data.user.sub} joined room ${roomId}`);
        return { event: 'joinedRoom', data: roomId };
    }
    async handleLeaveRoom(client, roomId) {
        await client.leave(roomId);
        this.logger.log(`User ${client.data.user.sub} left room ${roomId}`);
        return { event: 'leftRoom', data: roomId };
    }
    async handleMessage(client, payload) {
        const userId = client.data.user.sub;
        const message = await this.chatService.saveMessage(userId, payload.content, payload.roomId, payload.receiverId);
        this.server.to(payload.roomId).emit('newMessage', message);
        if (payload.receiverId) {
            this.server.to(`user:${payload.receiverId}`).emit('notification', {
                type: 'message',
                content: `New message from ${client.data.user.email}`,
                roomId: payload.roomId
            });
        }
        return message;
    }
    async handleMarkAsRead(client, roomId) {
        const userId = client.data.user.sub;
        await this.chatService.markAsRead(roomId, userId);
        return { status: 'success' };
    }
    extractToken(client) {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
            return authHeader.split(' ')[1];
        }
        return null;
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('markAsRead'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkAsRead", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: 'chat',
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        jwt_1.JwtService,
        config_1.ConfigService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map