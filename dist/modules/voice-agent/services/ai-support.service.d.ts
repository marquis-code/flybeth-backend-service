import { AIEngineService } from './ai-engine.service';
import { BookingsService } from '../../bookings/bookings.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
export declare class AISupportService {
    private aiEngineService;
    private bookingsService;
    private notificationsService;
    private configService;
    private readonly logger;
    constructor(aiEngineService: AIEngineService, bookingsService: BookingsService, notificationsService: NotificationsService, configService: ConfigService);
    handleSupportQuery(userId: string, query: string, context?: Record<string, any>): Promise<{
        answer: string;
        actionTaken?: string;
        escalated?: boolean;
    }>;
    escalateToHumanAgent(userId: string, issue: string, category: string): Promise<void>;
    getFAQAnswer(question: string): Promise<string>;
}
