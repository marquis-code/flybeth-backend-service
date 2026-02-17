import { Model } from 'mongoose';
import { BookingDocument } from '../../bookings/schemas/booking.schema';
import { FlightsIntegrationService } from '../../integrations/flights-integration.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { AIEngineService } from './ai-engine.service';
export declare class DisruptionAlertService {
    private bookingModel;
    private flightsIntegrationService;
    private notificationsService;
    private aiEngineService;
    private readonly logger;
    constructor(bookingModel: Model<BookingDocument>, flightsIntegrationService: FlightsIntegrationService, notificationsService: NotificationsService, aiEngineService: AIEngineService);
    monitorActiveFlights(): Promise<void>;
    private isDisrupted;
    private calculateDelay;
    private handleDisruption;
}
