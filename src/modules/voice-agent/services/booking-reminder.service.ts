// src/modules/voice-agent/services/booking-reminder.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { BookingFlowService } from './booking-flow.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../../common/constants/roles.constant';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class BookingReminderService {
    private readonly logger = new Logger(BookingReminderService.name);

    constructor(
        private bookingFlowService: BookingFlowService,
        private notificationsService: NotificationsService,
    ) { }

    // Check for abandoned drafts every 30 minutes
    @Cron('*/30 * * * *')
    async checkAbandonedDrafts() {
        this.logger.log('Checking for abandoned booking drafts...');

        // Find drafts untouched for > 30 mins but < 24 hours
        const drafts = await this.bookingFlowService.findAbandonedDrafts(30);

        for (const draft of drafts) {
            // Check if we already sent a reminder to avoid spamming
            // In a real app, we'd track sent notifications in a separate collection or flag
            // For now, assume we check a "reminded" flag on the draft (would need schema update) or just log

            try {
                // Send push notification
                await this.notificationsService.createNotification({
                    userId: draft.user._id.toString(),
                    type: NotificationType.DRAFT_ABANDONED,
                    title: 'Complete your booking',
                    message: `You left off while ${this.getStepDescription(draft.currentStep)}. Tap to resume!`,
                    data: { draftId: draft._id, step: draft.currentStep },
                });

                // Mark draft as 'reminded' or update lastInteraction to avoid re-triggering immediately
                // For this implementation, we'll mark as abandoned to stop checking
                await this.bookingFlowService.abandonFlow(draft._id.toString());
            } catch (error) {
                this.logger.error(`Failed to send reminder for draft ${draft._id}: ${error.message}`);
            }
        }
    }

    private getStepDescription(step: string): string {
        const descriptions: Record<string, string> = {
            search: 'searching for flights',
            select_flight: 'selecting your flight',
            select_stay: 'choosing a hotel',
            passenger_details: 'adding passengers',
            payment: 'making payment',
        };
        return descriptions[step] || 'booking your trip';
    }
}
