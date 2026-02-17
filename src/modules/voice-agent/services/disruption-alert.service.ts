// src/modules/voice-agent/services/disruption-alert.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../../bookings/schemas/booking.schema';
import { BookingStatus, NotificationType } from '../../../common/constants/roles.constant';
import { FlightsIntegrationService } from '../../integrations/flights-integration.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { AIEngineService } from './ai-engine.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DisruptionAlertService {
    private readonly logger = new Logger(DisruptionAlertService.name);

    constructor(
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
        private flightsIntegrationService: FlightsIntegrationService,
        private notificationsService: NotificationsService,
        private aiEngineService: AIEngineService,
    ) { }

    // Run every 15 minutes to check active bookings
    @Cron('*/15 * * * *')
    async monitorActiveFlights() {
        this.logger.log('Starting disruption monitoring...');

        // Find bookings with flights departing within 24 hours
        const now = new Date();
        const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const bookings = await this.bookingModel.find({
            status: { $in: [BookingStatus.CONFIRMED, BookingStatus.TICKETED] },
            'flights.0': { $exists: true },
        }).populate('flights.flight').exec();

        for (const booking of bookings) {
            // Filter flights departing soon
            // Assuming simplified check for first flight leg
            // In production, would check all segments
            const firstFlight = booking.flights[0]?.flight as any;
            if (!firstFlight || !firstFlight.departure?.at) continue;

            const departureTime = new Date(firstFlight.departure.at);
            if (departureTime < now || departureTime > next24h) continue;

            try {
                // Check real-time status via Amadeus
                const status = await this.flightsIntegrationService.onDemandFlightStatus({
                    carrierCode: firstFlight.carrierCode,
                    flightNumber: firstFlight.number,
                    scheduledDepartureDate: departureTime.toISOString().split('T')[0],
                });

                if (this.isDisrupted(status)) {
                    await this.handleDisruption(booking, status, firstFlight);
                }
            } catch (error) {
                this.logger.error(`Error checking flight status for ${booking.pnr}: ${error.message}`);
            }
        }
    }

    private isDisrupted(status: any): boolean {
        // Simplified check based on Amadeus response structure
        const flightStatus = status?.data?.[0]?.flightStatus;
        return flightStatus === 'CANCELLED' || flightStatus === 'DIVERTED' ||
            (status?.data?.[0]?.legs?.[0]?.departure?.actual &&
                this.calculateDelay(status) > 30); // 30 mins delay
    }

    private calculateDelay(status: any): number {
        // Mock delay calculation logic
        // In reality, compare scheduled vs estimated/actual times
        return 0;
    }

    private async handleDisruption(
        booking: BookingDocument,
        status: any,
        flight: any,
    ) {
        // Use AI to analyze severity and generate message
        const analysis = await this.aiEngineService.analyzeDisruption(status, booking);

        // Notify user
        await this.notificationsService.createNotification({
            userId: booking.user.toString(),
            type: NotificationType.FLIGHT_DISRUPTION,
            title: `Flight Alert: ${flight.carrierCode}${flight.number}`,
            message: analysis.message,
            channel: 'push' as any, // Default to push for urgency
            data: {
                pnr: booking.pnr,
                severity: analysis.severity,
                suggestions: analysis.suggestions,
                statusRaw: status,
            },
        });

        // Also email for high severity
        if (analysis.severity === 'high' || analysis.severity === 'critical') {
            await this.notificationsService.sendEmail(
                booking.contactDetails.email,
                `URGENT: Flight Disruption Alert (${booking.pnr})`,
                `<p>${analysis.message}</p><ul>${analysis.suggestions.map(s => `<li>${s}</li>`).join('')}</ul>`
            );
        }

        this.logger.warn(`Disruption alert sent for booking ${booking.pnr} (${analysis.severity})`);
    }
}
