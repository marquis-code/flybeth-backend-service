import { BookingFlowService } from './booking-flow.service';
import { NotificationsService } from '../../notifications/notifications.service';
export declare class BookingReminderService {
    private bookingFlowService;
    private notificationsService;
    private readonly logger;
    constructor(bookingFlowService: BookingFlowService, notificationsService: NotificationsService);
    checkAbandonedDrafts(): Promise<void>;
    private getStepDescription;
}
