// src/modules/notifications/notifications.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/constants/roles.constant";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { MongoIdValidationPipe } from "../../common/pipes/mongo-id-validation.pipe";

@ApiTags("notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("my-notifications")
  @ApiOperation({ summary: "Get current user notifications" })
  async getUserNotifications(
    @CurrentUser("_id") userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.notificationsService.getUserNotifications(
      userId,
      paginationDto,
    );
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread notification count" })
  async getUnreadCount(@CurrentUser("_id") userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  // --- Email Template Management (Admin Only) ---

  @Post("templates/seed")
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  async seedTemplates() {
    await this.notificationsService.seedDefaultTemplates();
    return { success: true, message: "Templates seeded successfully" };
  }

  @Get("templates")
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  async getTemplates(@Query("tenantId") tenantId: string) {
    return this.notificationsService.getTemplates(tenantId);
  }

  @Get("templates/:id")
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  async getTemplate(@Param("id", MongoIdValidationPipe) id: string) {
    return this.notificationsService.updateTemplate(id, {}); // Fallback if no separate getById
  }

  @Post("templates")
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  async createTemplate(@Body() data: any) {
    return this.notificationsService.createTemplate(data);
  }

  @Patch("templates/:id")
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  async updateTemplate(
    @Param("id", MongoIdValidationPipe) id: string,
    @Body() data: any,
  ) {
    return this.notificationsService.updateTemplate(id, data);
  }

  @Delete("templates/:id")
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  async deleteTemplate(@Param("id", MongoIdValidationPipe) id: string) {
    await this.notificationsService.deleteTemplate(id);
    return { success: true };
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark notification as read" })
  markAsRead(@Param("id", MongoIdValidationPipe) id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch("mark-all-read")
  @ApiOperation({ summary: "Mark all notifications as read" })
  markAllAsRead(@CurrentUser("_id") userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
