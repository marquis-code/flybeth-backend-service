// src/modules/voice-agent/services/ai-support.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AIEngineService } from './ai-engine.service';
import { VoiceAgentIntent, ConversationRole } from '../../../common/constants/roles.constant';
import { BookingsService } from '../../bookings/bookings.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AISupportService {
    private readonly logger = new Logger(AISupportService.name);

    constructor(
        private aiEngineService: AIEngineService,
        private bookingsService: BookingsService,
        private notificationsService: NotificationsService,
        private configService: ConfigService,
    ) { }

    async handleSupportQuery(
        userId: string,
        query: string,
        context: Record<string, any> = {},
    ): Promise<{
        answer: string;
        actionTaken?: string;
        escalated?: boolean;
    }> {
        // Fetch recent booking if relevant
        let bookingData: Record<string, any> | null = null;
        if (context.bookingId) {
            try {
                const booking = await this.bookingsService.findById(context.bookingId);
                bookingData = {
                    pnr: (booking as any).pnr,
                    status: (booking as any).status,
                    flights: (booking as any).flights,
                    totalAmount: (booking as any).pricing?.totalAmount,
                };
            } catch (e) {
                this.logger.warn(`Could not fetch booking context: ${e.message}`);
            }
        }

        // Use AI engine to determine response
        const result = await this.aiEngineService.handleSupportQuery(query, {
            userId,
            conversationHistory: context.history || [],
            bookingData,
        });

        if (result.needsEscalation) {
            await this.escalateToHumanAgent(userId, query, result.category);
            return {
                answer: 'I\'ve forwarded your request to a human agent who will assist you shortly. Is there anything else I can help with in the meantime?',
                escalated: true,
                actionTaken: 'ticket_created',
            };
        }

        return {
            answer: result.answer,
            escalated: false,
        };
    }

    async escalateToHumanAgent(
        userId: string,
        issue: string,
        category: string,
    ): Promise<void> {
        this.logger.log(`Escalating issue for user ${userId}: ${issue} (${category})`);

        // Create a support notification for admins/agents
        await this.notificationsService.createNotification({
            userId, // potentially notify the user too, or a specific admin ID
            title: `Support Escalation: ${category}`,
            message: `User needs help: ${issue}`,
            type: 'system' as any,
            data: { userId, issue, category, timestamp: new Date() },
        });

        // In a real system, this would create a ticket in Zendesk or similar
        // For now, we log it and send an email to support
        const supportEmail = this.configService.get('SMTP_USER');
        if (supportEmail) {
            await this.notificationsService.sendEmail(
                supportEmail,
                `Urgent: User Escalation (${category})`,
                `<p>User ID: ${userId}</p><p>Issue: ${issue}</p><p>Category: ${category}</p>`,
            );
        }
    }

    async getFAQAnswer(question: string): Promise<string> {
        // Simple wrapper around AI engine for non-authenticated FAQ
        const result = await this.aiEngineService.handleSupportQuery(question, {
            userId: 'anonymous',
        });
        return result.answer;
    }
}
