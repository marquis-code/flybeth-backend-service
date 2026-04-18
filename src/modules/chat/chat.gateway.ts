// src/modules/chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { AutoResponseService } from "./auto-response.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Types } from "mongoose";

const BOT_USER_ID = "000000000000000000000001";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
  namespace: "chat",
  transports: ["websocket", "polling"],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  
  // Track online users: userId -> socketId[]
  private onlineUsers = new Map<string, string[]>();
  // Track admin/staff sockets for availability detection
  private adminSockets = new Set<string>();

  constructor(
    private chatService: ChatService,
    private autoResponseService: AutoResponseService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        // Allow guest connection
        const guestId = `guest:${client.id}`;
        client.data.user = { 
          id: guestId, 
          sub: guestId,
          role: "guest",
          isGuest: true 
        };
        await client.join(guestId);
        this.logger.log(`Guest connected: ${client.id}`);
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get("JWT_SECRET"),
      });

      // Attach user info to socket
      client.data.user = payload;
      const userId = payload.sub || payload.id;
      const roleName = typeof payload.role === 'string' ? payload.role : (payload.role?.name || 'unknown');

      // Online status tracking
      const userSockets = this.onlineUsers.get(userId) || [];
      userSockets.push(client.id);
      this.onlineUsers.set(userId, userSockets);

      // Track admins/staff for availability
      if (['super_admin', 'tenant_admin', 'staff', 'admin'].includes(roleName)) {
        this.adminSockets.add(client.id);
        this.logger.log(`Admin/Staff connected: ${client.id} (Role: ${roleName})`);
      }

      // Join user to their own room (for personal notifications)
      await client.join(`user:${userId}`);
      await client.join(`role:${roleName}`);

      this.logger.log(
        `Client connected: ${client.id} (User: ${userId}, Role: ${roleName})`,
      );
    } catch (e) {
      this.logger.error(`Connection failed: ${e.message}`);
      const guestId = `guest:${client.id}`;
      client.data.user = { id: guestId, sub: guestId, role: "guest", isGuest: true };
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user?.sub || client.data.user?.id;
    if (userId) {
      const userSockets = this.onlineUsers.get(userId) || [];
      const updatedSockets = userSockets.filter(id => id !== client.id);
      if (updatedSockets.length > 0) {
        this.onlineUsers.set(userId, updatedSockets);
      } else {
        this.onlineUsers.delete(userId);
      }
    }
    this.adminSockets.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("joinRoom")
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    await client.join(roomId);
    this.logger.log(`User ${client.data.user?.sub || client.data.user?.id} joined room ${roomId}`);
    return { event: "joinedRoom", data: roomId };
  }

  @SubscribeMessage("leaveRoom")
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    await client.leave(roomId);
    this.logger.log(`User ${client.data.user?.sub || client.data.user?.id} left room ${roomId}`);
    return { event: "leftRoom", data: roomId };
  }

  @SubscribeMessage("sendMessage")
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { roomId: string; content: string; type?: string; metadata?: any; receiverId?: string; replyTo?: string },
  ) {
    try {
      this.logger.debug(`[ChatGateway] sendMessage received from ${client.id} for room ${payload.roomId}`);
      let userId = client.data.user.sub || client.data.user.id;
      const isGuest = client.data.user.isGuest || String(userId).startsWith('guest:');
      const senderRole = typeof client.data.user.role === 'string' ? client.data.user.role : (client.data.user.role?.name || 'unknown');

      // Use the consistent socket-level ID (guest:id or real user id)
      const senderIdForDb = userId;

      // Save user message to DB
      const message = await this.chatService.saveMessage(senderIdForDb, {
        roomId: payload.roomId,
        content: payload.content,
        type: payload.type || 'text',
        metadata: {
          ...payload.metadata,
          isGuest,
          guestIdentifier: userId,
          senderRole
        },
        replyTo: payload.replyTo
      });

      // Broadcast user message to room
      this.server.to(payload.roomId).emit("newMessage", message);

      // ─── AGGRESSIVE Admin Notifications ─────────────────────────────
      if (isGuest || senderRole === "customer" || senderRole === "guest" || senderRole === "user") {
        this.server.to("role:super_admin").to("role:tenant_admin").to("role:staff").to("role:admin").emit("newMessage", message);
        
        const identifier = payload.metadata?.userName || payload.metadata?.userEmail || client.data.user.email || 'Guest';
        this.server
          .to("role:super_admin")
          .to("role:tenant_admin")
          .to("role:staff")
          .to("role:admin")
          .emit("notification", {
            type: "support_request",
            content: `New support message from ${identifier}`,
            roomId: payload.roomId,
            senderId: senderIdForDb,
            timestamp: new Date().toISOString()
          });

        this.server
          .to("role:super_admin")
          .to("role:tenant_admin")
          .to("role:staff")
          .to("role:admin")
          .emit("support_chat_update", {
            roomId: payload.roomId,
            message,
            identifier
          });
      }

      // ─── AUTO-RESPONSE BOT Logic ────────────────────────────────────
      const isFromCustomer = isGuest || senderRole === "customer" || senderRole === "guest" || senderRole === "user" || senderRole === "unknown";
      const isAdminRole = ['super_admin', 'tenant_admin', 'staff', 'admin'].includes(senderRole);

      if (isFromCustomer && !isAdminRole) {
        const room = await this.chatService.getRoomById(payload.roomId);
        const isSupportRoom = room?.type === 'support';
        const isBotHandling = room?.status === 'bot_handling' || room?.status === 'open';

        if (isSupportRoom && isBotHandling) {
          const adminOnline = this.adminSockets.size > 0;
          const autoResult = this.autoResponseService.findResponse(payload.content);

          if (autoResult.matched) {
            setTimeout(async () => {
              try {
                const botMessage = await this.chatService.saveBotMessage(
                  payload.roomId,
                  autoResult.response,
                  { category: autoResult.category, confidence: autoResult.confidence }
                );
                this.server.to(payload.roomId).emit("newMessage", botMessage);
                this.server.to("role:super_admin").to("role:tenant_admin").to("role:staff").to("role:admin").emit("newMessage", botMessage);
              } catch (err) {
                this.logger.error(`[Bot] Failed to send auto-response: ${err.message}`);
              }
            }, 800 + Math.random() * 1200);
          } else {
            if (!adminOnline) {
              setTimeout(async () => {
                try {
                  const escalationMsg = await this.chatService.saveBotMessage(
                    payload.roomId,
                    this.autoResponseService.getEscalationMessage(),
                    { isEscalation: true }
                  );
                  this.server.to(payload.roomId).emit("newMessage", escalationMsg);
                  this.server.to("role:super_admin").to("role:tenant_admin").to("role:staff").to("role:admin").emit("newMessage", escalationMsg);
                  await this.chatService.updateRoomStatus(payload.roomId, "agent_handling");
                } catch (err) {
                  this.logger.error(`[Bot] Escalation failed: ${err.message}`);
                }
              }, 1000);
            } else {
              await this.chatService.updateRoomStatus(payload.roomId, "agent_handling");
            }
          }
        }
      }

      if (isAdminRole) {
        const room = await this.chatService.getRoomById(payload.roomId);
        if (room?.type === 'support' && (room?.status === 'bot_handling' || room?.status === 'open')) {
          await this.chatService.updateRoomStatus(payload.roomId, "agent_handling", userId);
        }
      }

      if (payload.receiverId) {
        this.server.to(`user:${payload.receiverId}`).emit("notification", {
          type: "message",
          content: `New message from ${client.data.user.email || 'Support'}`,
          roomId: payload.roomId,
        });
      }
    } catch (err) {
      this.logger.error(`[ChatGateway] sendMessage ERROR: ${err.message}`, err.stack);
      client.emit('error', { message: 'Failed to send message', details: err.message });
    }
  }

  @SubscribeMessage("markAsRead")
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    const userId = client.data.user.sub || client.data.user.id;
    await this.chatService.markAsRead(roomId, userId);
    return { status: "success" };
  }

  @SubscribeMessage("typing")
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; isTyping: boolean; userName: string },
  ) {
    const userId = client.data.user.sub || client.data.user.id;
    this.server.to(payload.roomId).emit("user_typing", {
      roomId: payload.roomId,
      userId,
      isTyping: payload.isTyping,
      userName: payload.userName,
    });
  }

  // ─── External Methods Called from Services ──────────────────────────

  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit("notification", notification);
  }

  broadcastToAdmins(event: string, data: any) {
    this.server
      .to("role:super_admin")
      .to("role:tenant_admin")
      .to("role:staff")
      .to("role:admin")
      .emit(event, data);
  }

  broadcastSystemUpdate(data: any) {
    this.server.emit("system_update", data);
  }

  private extractToken(client: Socket): string | null {
    const token = client.handshake.auth?.token || client.handshake.headers.authorization;
    if (token && token.startsWith("Bearer ")) {
      return token.split(" ")[1];
    }
    return token || null;
  }
}
