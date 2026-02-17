import { Model } from 'mongoose';
import { BookingDraftDocument } from '../schemas/booking-draft.schema';
import { BookingDraftStep, VoiceAgentIntent } from '../../../common/constants/roles.constant';
import { FlightsService } from '../../flights/flights.service';
import { FlightsIntegrationService } from '../../integrations/flights-integration.service';
import { StaysService } from '../../stays/stays.service';
import { BookingsService } from '../../bookings/bookings.service';
export declare class BookingFlowService {
    private draftModel;
    private flightsService;
    private flightsIntegrationService;
    private staysService;
    private bookingsService;
    private readonly logger;
    constructor(draftModel: Model<BookingDraftDocument>, flightsService: FlightsService, flightsIntegrationService: FlightsIntegrationService, staysService: StaysService, bookingsService: BookingsService);
    startFlow(userId: string, voiceSessionId?: string): Promise<BookingDraftDocument>;
    getOrCreateDraft(userId: string, voiceSessionId?: string): Promise<BookingDraftDocument>;
    getDraft(draftId: string): Promise<BookingDraftDocument>;
    getUserDrafts(userId: string): Promise<BookingDraftDocument[]>;
    processStep(draftId: string, intent: VoiceAgentIntent, entities: Record<string, any>): Promise<{
        draft: BookingDraftDocument;
        results?: any;
        nextStep: BookingDraftStep;
        message: string;
    }>;
    private handleSearchStep;
    private handleSelectFlightStep;
    private handleSelectStayStep;
    private handlePassengerStep;
    private handleContactStep;
    private handleReviewStep;
    private handlePaymentStep;
    getFlowStatus(draftId: string): Promise<{
        currentStep: BookingDraftStep;
        completedSteps: string[];
        totalSteps: number;
        progressPercent: number;
        summary: Record<string, any>;
    }>;
    resumeFlow(draftId: string): Promise<{
        draft: BookingDraftDocument;
        contextSummary: string;
    }>;
    abandonFlow(draftId: string): Promise<void>;
    findAbandonedDrafts(thresholdMinutes?: number): Promise<BookingDraftDocument[]>;
    findDraftsForReminder(thresholdMinutes?: number): Promise<BookingDraftDocument[]>;
    private buildResumeSummary;
}
