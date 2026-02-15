// src/modules/notifications/notifications.controller.ts
import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { MongoIdValidationPipe } from '../../common/pipes/mongo-id-validation.pipe';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'Get user notifications' })
    findAll(
        @CurrentUser('_id') userId: string,
        @Query() paginationDto: PaginationDto,
    ) {
        return this.notificationsService.getUserNotifications(userId, paginationDto);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count' })
    getUnreadCount(@CurrentUser('_id') userId: string) {
        return this.notificationsService.getUnreadCount(userId);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    markAsRead(@Param('id', MongoIdValidationPipe) id: string) {
        return this.notificationsService.markAsRead(id);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    markAllAsRead(@CurrentUser('_id') userId: string) {
        return this.notificationsService.markAllAsRead(userId);
    }
}
