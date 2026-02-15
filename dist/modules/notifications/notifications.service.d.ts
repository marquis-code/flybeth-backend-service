import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { NotificationDocument } from './schemas/notification.schema';
import { NotificationType, NotificationChannel } from '../../common/constants/roles.constant';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class NotificationsService {
    private notificationModel;
    private configService;
    private readonly logger;
    private transporter;
    constructor(notificationModel: Model<NotificationDocument>, configService: ConfigService);
    createNotification(params: {
        userId: string;
        tenantId?: string;
        type: NotificationType;
        title: string;
        message: string;
        data?: Record<string, any>;
        channel?: NotificationChannel;
    }): Promise<NotificationDocument>;
    sendEmail(to: string, subject: string, html: string): Promise<void>;
    sendBookingConfirmation(params: {
        email: string;
        pnr: string;
        firstName: string;
        totalAmount: number;
        currency: string;
        flightDetails: string;
    }): Promise<void>;
    sendPaymentReceipt(params: {
        email: string;
        firstName: string;
        amount: number;
        currency: string;
        reference: string;
        pnr: string;
    }): Promise<void>;
    getUserNotifications(userId: string, paginationDto: PaginationDto): Promise<import("../../common/utils/pagination.util").PaginatedResult<NotificationDocument>>;
    markAsRead(id: string): Promise<NotificationDocument | null>;
    markAllAsRead(userId: string): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
}
