import { Controller, Get, Post, Body, Query, Req, Param } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { AutoResponseService } from "./auto-response.service";
import { ChatGateway } from "./chat.gateway";
import { CreateRoomDto, SendMessageDto } from "./dto/chat.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Chat")
@Controller("chat")
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly autoResponseService: AutoResponseService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Public()
  @Post("support/init")
  @ApiOperation({ summary: "Initialize a support room for a guest or logged-in user" })
  initSupport(@Body() body: { email: string, name: string, tenantId?: string, userId?: string }) {
    if (body.userId) {
      return this.chatService.findOrCreateUserSupportRoom(body.userId, body.name, body.email);
    }
    return this.chatService.findOrCreateGuestSupportRoom(body.email, body.name, body.tenantId);
  }

  @Public()
  @Get("support/rooms/:roomId/messages")
  @ApiOperation({ summary: "Get messages in a support room (public for guests)" })
  getSupportMessages(@Param("roomId") roomId: string, @Query() paginationDto: PaginationDto) {
    return this.chatService.getRoomMessages(roomId, paginationDto);
  }

  @ApiBearerAuth()
  @Get("rooms")
  @ApiOperation({ summary: "Get my chat rooms" })
  getMyRooms(@Req() req: any, @Query() paginationDto: PaginationDto) {
    return this.chatService.getMyRooms(req.user.sub || req.user._id, paginationDto);
  }

  @ApiBearerAuth()
  @Get("all")
  @ApiOperation({ summary: "Get all chat rooms (Admin only)" })
  getAllRooms(@Query() paginationDto: PaginationDto) {
    return this.chatService.getAllRooms(paginationDto);
  }

  @ApiBearerAuth()
  @Get("support")
  @ApiOperation({ summary: "Get all support chat rooms (Admin only)" })
  getSupportRooms(@Query() paginationDto: PaginationDto) {
    return this.chatService.getSupportRooms(paginationDto);
  }

  @ApiBearerAuth()
  @Post("rooms")
  @ApiOperation({ summary: "Create or find a direct chat room" })
  findOrCreateRoom(@Req() req: any, @Body() body: { participantId: string }) {
    return this.chatService.findOrCreateDirectRoom(req.user.sub || req.user._id, body.participantId, req.user.tenant);
  }

  @ApiBearerAuth()
  @Post("support/rooms/:roomId/resolve")
  @ApiOperation({ summary: "Resolve a support room (Admin only)" })
  async resolveSupportRoom(@Param("roomId") roomId: string) {
    // In a full implementation we would check if req.user has admin roles
    const room = await this.chatService.resolveChat(roomId);
    const msg = await this.chatService.saveBotMessage(
      roomId,
      `This chat has been successfully resolved. Your ticket number is #${room.ticketNumber}. Have a great day!`
    );
    this.chatGateway.server.to(roomId).emit("newMessage", msg);
    this.chatGateway.server.to(roomId).emit('roomResolved', { roomId: roomId, ticketNumber: room.ticketNumber });
    this.chatGateway.broadcastToAdmins('support_chat_update', { roomId: roomId, status: 'resolved', ticketNumber: room.ticketNumber });
    return room;
  }

  @ApiBearerAuth()
  @Get("rooms/:roomId/messages")
  @ApiOperation({ summary: "Get messages in a room" })
  getMessages(@Param("roomId") roomId: string, @Query() paginationDto: PaginationDto) {
    return this.chatService.getRoomMessages(roomId, paginationDto);
  }

  @ApiBearerAuth()
  @Post("rooms/group")
  @ApiOperation({ summary: "Create a group chat room" })
  createGroup(@Req() req: any, @Body() dto: CreateRoomDto) {
    return this.chatService.createGroupRoom(dto, req.user.sub || req.user._id, req.user.tenant);
  }

  @Public()
  @Get("faqs")
  @ApiOperation({ summary: "Get all FAQ entries for the bot" })
  getFaqs() {
    return this.autoResponseService.getAllFaqs();
  }
}
