import { NotificationsService } from './notifications.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(userId: string, paginationDto: PaginationDto): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./schemas/notification.schema").NotificationDocument>>;
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(id: string): Promise<import("./schemas/notification.schema").NotificationDocument | null>;
    markAllAsRead(userId: string): Promise<void>;
}
