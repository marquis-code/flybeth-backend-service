// src/modules/voice-agent/services/booking-flow.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BookingDraft, BookingDraftDocument } from '../schemas/booking-draft.schema';
import {
    BookingDraftStep,
    BookingDraftStatus,
    VoiceAgentIntent,
} from '../../../common/constants/roles.constant';
import { FlightsService } from '../../flights/flights.service';
import { FlightsIntegrationService } from '../../integrations/flights-integration.service';
import { StaysService } from '../../stays/stays.service';
import { BookingsService } from '../../bookings/bookings.service';

const STEP_ORDER: BookingDraftStep[] = [
    BookingDraftStep.SEARCH,
    BookingDraftStep.SELECT_FLIGHT,
    BookingDraftStep.SELECT_STAY,
    BookingDraftStep.PASSENGER_DETAILS,
    BookingDraftStep.CONTACT_INFO,
    BookingDraftStep.REVIEW,
    BookingDraftStep.PAYMENT,
    BookingDraftStep.CONFIRMED,
];

@Injectable()
export class BookingFlowService {
    private readonly logger = new Logger(BookingFlowService.name);

    constructor(
        @InjectModel(BookingDraft.name) private draftModel: Model<BookingDraftDocument>,
        private flightsService: FlightsService,
        private flightsIntegrationService: FlightsIntegrationService,
        private staysService: StaysService,
        private bookingsService: BookingsService,
    ) { }

    // ═══════════════════════ Flow Lifecycle ═══════════════════════

    async startFlow(
        userId: string,
        voiceSessionId?: string,
    ): Promise<BookingDraftDocument> {
        const draft = new this.draftModel({
            user: new Types.ObjectId(userId),
            status: BookingDraftStatus.IN_PROGRESS,
            currentStep: BookingDraftStep.SEARCH,
            lastInteractionAt: new Date(),
            voiceSessionId: voiceSessionId
                ? new Types.ObjectId(voiceSessionId)
                : undefined,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });
        return draft.save();
    }

    async getOrCreateDraft(
        userId: string,
        voiceSessionId?: string,
    ): Promise<BookingDraftDocument> {
        // Find the most recent active draft
        const existing = await this.draftModel
            .findOne({
                user: new Types.ObjectId(userId),
                status: BookingDraftStatus.IN_PROGRESS,
            })
            .sort({ lastInteractionAt: -1 })
            .exec();

        if (existing) {
            existing.lastInteractionAt = new Date();
            return existing.save();
        }

        return this.startFlow(userId, voiceSessionId);
    }

    async getDraft(draftId: string): Promise<BookingDraftDocument> {
        const draft = await this.draftModel.findById(draftId).exec();
        if (!draft) {
            throw new NotFoundException(`Booking draft ${draftId} not found`);
        }
        return draft;
    }

    async getUserDrafts(userId: string): Promise<BookingDraftDocument[]> {
        return this.draftModel
            .find({
                user: new Types.ObjectId(userId),
                status: { $in: [BookingDraftStatus.IN_PROGRESS] },
            })
            .sort({ lastInteractionAt: -1 })
            .limit(10)
            .exec();
    }

    // ═══════════════════════ Step Processing ═══════════════════════

    async processStep(
        draftId: string,
        intent: VoiceAgentIntent,
        entities: Record<string, any>,
    ): Promise<{
        draft: BookingDraftDocument;
        results?: any;
        nextStep: BookingDraftStep;
        message: string;
    }> {
        const draft = await this.getDraft(draftId);

        switch (draft.currentStep) {
            case BookingDraftStep.SEARCH:
                return this.handleSearchStep(draft, intent, entities);
            case BookingDraftStep.SELECT_FLIGHT:
                return this.handleSelectFlightStep(draft, intent, entities);
            case BookingDraftStep.SELECT_STAY:
                return this.handleSelectStayStep(draft, intent, entities);
            case BookingDraftStep.PASSENGER_DETAILS:
                return this.handlePassengerStep(draft, intent, entities);
            case BookingDraftStep.CONTACT_INFO:
                return this.handleContactStep(draft, intent, entities);
            case BookingDraftStep.REVIEW:
                return this.handleReviewStep(draft, intent, entities);
            case BookingDraftStep.PAYMENT:
                return this.handlePaymentStep(draft, intent, entities);
            default:
                return {
                    draft,
                    nextStep: draft.currentStep,
                    message: 'Your booking is already complete!',
                };
        }
    }

    // ═══════════════════════ Step Handlers ═══════════════════════

    private async handleSearchStep(
        draft: BookingDraftDocument,
        intent: VoiceAgentIntent,
        entities: Record<string, any>,
    ) {
        // Update search criteria with extracted entities
        if (entities.origin) draft.searchCriteria.origin = entities.origin;
        if (entities.destination) draft.searchCriteria.destination = entities.destination;
        if (entities.departureDate) draft.searchCriteria.departureDate = entities.departureDate;
        if (entities.returnDate) {
            draft.searchCriteria.returnDate = entities.returnDate;
            draft.searchCriteria.isRoundTrip = true;
        }
        if (entities.passengers) draft.searchCriteria.adults = entities.passengers;
        if (entities.adults) draft.searchCriteria.adults = entities.adults;
        if (entities.children) draft.searchCriteria.children = entities.children;
        if (entities.travelClass) draft.searchCriteria.travelClass = entities.travelClass;

        // Check if we have enough information to search
        const criteria = draft.searchCriteria;
        if (!criteria.origin || !criteria.destination) {
            draft.lastInteractionAt = new Date();
            await draft.save();
            return {
                draft,
                nextStep: BookingDraftStep.SEARCH,
                message: !criteria.origin
                    ? 'Where would you like to fly from?'
                    : 'Where would you like to fly to?',
            };
        }

        if (!criteria.departureDate) {
            draft.lastInteractionAt = new Date();
            await draft.save();
            return {
                draft,
                nextStep: BookingDraftStep.SEARCH,
                message: 'When would you like to depart?',
            };
        }

        // Perform the search
        let results;
        try {
            results = await this.flightsIntegrationService.searchAmadeusOffers({
                originLocationCode: criteria.origin,
                destinationLocationCode: criteria.destination,
                departureDate: criteria.departureDate,
                returnDate: criteria.returnDate,
                adults: criteria.adults || 1,
                children: criteria.children,
                travelClass: criteria.travelClass?.toUpperCase(),
                max: 10,
            } as any);
        } catch (error) {
            this.logger.warn(`Amadeus search failed, trying local: ${error.message}`);
            results = await this.flightsService.search({
                origin: criteria.origin,
                destination: criteria.destination,
                departureDate: criteria.departureDate,
            } as any);
        }

        draft.searchResults = Array.isArray(results?.data) ? results.data : (results?.data || []);
        draft.currentStep = BookingDraftStep.SELECT_FLIGHT;
        draft.completedSteps.push(BookingDraftStep.SEARCH);
        draft.lastInteractionAt = new Date();
        await draft.save();

        return {
            draft,
            results: draft.searchResults,
            nextStep: BookingDraftStep.SELECT_FLIGHT,
            message: `I found ${draft.searchResults.length} flights from ${criteria.origin} to ${criteria.destination}. Which one would you like to book?`,
        };
    }

    private async handleSelectFlightStep(
        draft: BookingDraftDocument,
        intent: VoiceAgentIntent,
        entities: Record<string, any>,
    ) {
        const selectedIndex = entities.selectedIndex ?? entities.index ?? 0;

        if (draft.searchResults && draft.searchResults[selectedIndex]) {
            const selected = draft.searchResults[selectedIndex];
            draft.selectedFlights.push({
                flightData: selected,
                flightId: selected.id || selected._id,
                price: selected.price?.total || selected.price?.grandTotal || 0,
                currency: selected.price?.currency || 'USD',
                travelClass: draft.searchCriteria.travelClass || 'economy',
            });

            draft.currentStep = BookingDraftStep.SELECT_STAY;
            draft.completedSteps.push(BookingDraftStep.SELECT_FLIGHT);
            draft.lastInteractionAt = new Date();
            await draft.save();

            return {
                draft,
                nextStep: BookingDraftStep.SELECT_STAY,
                message: 'Flight selected! Would you also like to add a hotel to your booking? Say "skip" to continue without a hotel.',
            };
        }

        return {
            draft,
            nextStep: BookingDraftStep.SELECT_FLIGHT,
            message: 'I couldn\'t find that option. Could you tell me which flight number you\'d like to select?',
        };
    }

    private async handleSelectStayStep(
        draft: BookingDraftDocument,
        intent: VoiceAgentIntent,
        entities: Record<string, any>,
    ) {
        // If user says skip/no
        if (
            entities.skip ||
            intent === VoiceAgentIntent.GENERAL_QUERY &&
            (entities.rawText || '').toLowerCase().includes('skip')
        ) {
            draft.currentStep = BookingDraftStep.PASSENGER_DETAILS;
            draft.completedSteps.push(BookingDraftStep.SELECT_STAY);
            draft.lastInteractionAt = new Date();
            await draft.save();

            return {
                draft,
                nextStep: BookingDraftStep.PASSENGER_DETAILS,
                message: 'No problem! Let\'s add passenger details. Please provide the first passenger\'s full name and date of birth.',
            };
        }

        // If user selects a stay
        if (entities.selectedIndex !== undefined && draft.searchResults?.length) {
            const selected = draft.searchResults[entities.selectedIndex];
            draft.selectedStays.push({
                stayData: selected,
                stayId: selected.id || selected._id,
                checkIn: entities.checkIn || draft.searchCriteria.departureDate,
                checkOut: entities.checkOut || draft.searchCriteria.returnDate || '',
                price: selected.price || 0,
                currency: selected.currency || 'USD',
            });
        }

        // Search for stays if not done
        if (!draft.searchResults?.length || intent === VoiceAgentIntent.SEARCH_STAY) {
            try {
                const stays = await this.staysService.search({
                    location: entities.destination || draft.searchCriteria.destination,
                    checkIn: entities.checkIn || draft.searchCriteria.departureDate,
                    checkOut: entities.checkOut || draft.searchCriteria.returnDate,
                } as any);
                draft.searchResults = Array.isArray(stays) ? stays : [];
            } catch {
                draft.searchResults = [];
            }
        }

        draft.currentStep = BookingDraftStep.PASSENGER_DETAILS;
        draft.completedSteps.push(BookingDraftStep.SELECT_STAY);
        draft.lastInteractionAt = new Date();
        await draft.save();

        return {
            draft,
            nextStep: BookingDraftStep.PASSENGER_DETAILS,
            message: 'Now let\'s add passenger details. Please provide the first passenger\'s full name and date of birth.',
        };
    }

    private async handlePassengerStep(
        draft: BookingDraftDocument,
        intent: VoiceAgentIntent,
        entities: Record<string, any>,
    ) {
        if (entities.firstName || entities.lastName || entities.name) {
            const nameParts = (entities.name || '').split(' ');
            draft.passengerDetails.push({
                firstName: entities.firstName || nameParts[0] || '',
                lastName: entities.lastName || nameParts.slice(1).join(' ') || '',
                dateOfBirth: entities.dateOfBirth || entities.dob,
                passportNumber: entities.passportNumber || entities.passport,
                nationality: entities.nationality,
                type: entities.passengerType || 'adult',
            });
        }

        const totalRequired = (draft.searchCriteria.adults || 1) + (draft.searchCriteria.children || 0);
        const current = draft.passengerDetails.length;

        if (current < totalRequired) {
            draft.lastInteractionAt = new Date();
            await draft.save();
            return {
                draft,
                nextStep: BookingDraftStep.PASSENGER_DETAILS,
                message: `Passenger ${current} added. Please provide details for passenger ${current + 1} of ${totalRequired}.`,
            };
        }

        draft.currentStep = BookingDraftStep.CONTACT_INFO;
        draft.completedSteps.push(BookingDraftStep.PASSENGER_DETAILS);
        draft.lastInteractionAt = new Date();
        await draft.save();

        return {
            draft,
            nextStep: BookingDraftStep.CONTACT_INFO,
            message: 'All passengers added! Now I need your contact details — email address and phone number, please.',
        };
    }

    private async handleContactStep(
        draft: BookingDraftDocument,
        intent: VoiceAgentIntent,
        entities: Record<string, any>,
    ) {
        draft.contactDetails = {
            email: entities.email || draft.contactDetails?.email || '',
            phone: entities.phone || draft.contactDetails?.phone || '',
            name: entities.contactName || entities.name || draft.contactDetails?.name || '',
        };

        if (!draft.contactDetails.email) {
            draft.lastInteractionAt = new Date();
            await draft.save();
            return {
                draft,
                nextStep: BookingDraftStep.CONTACT_INFO,
                message: 'What\'s your email address for the booking confirmation?',
            };
        }

        if (!draft.contactDetails.phone) {
            draft.lastInteractionAt = new Date();
            await draft.save();
            return {
                draft,
                nextStep: BookingDraftStep.CONTACT_INFO,
                message: 'And your phone number?',
            };
        }

        // Calculate pricing
        const totalFlight = draft.selectedFlights.reduce((sum, f) => sum + (f.price || 0), 0);
        const totalStay = draft.selectedStays.reduce((sum, s) => sum + (s.price || 0), 0);
        const totalCar = draft.selectedCars.reduce((sum, c) => sum + (c.price || 0), 0);

        draft.pricing = {
            flightTotal: totalFlight,
            stayTotal: totalStay,
            carTotal: totalCar,
            subtotal: totalFlight + totalStay + totalCar,
            taxes: Math.round((totalFlight + totalStay + totalCar) * 0.1),
            totalAmount: Math.round((totalFlight + totalStay + totalCar) * 1.1),
            currency: draft.selectedFlights[0]?.currency || 'USD',
        };

        draft.currentStep = BookingDraftStep.REVIEW;
        draft.completedSteps.push(BookingDraftStep.CONTACT_INFO);
        draft.lastInteractionAt = new Date();
        await draft.save();

        return {
            draft,
            nextStep: BookingDraftStep.REVIEW,
            message: `Here's your booking summary:\n• Flights: ${draft.pricing.currency} ${draft.pricing.flightTotal}\n• Total: ${draft.pricing.currency} ${draft.pricing.totalAmount}\n• Passengers: ${draft.passengerDetails.length}\n• Contact: ${draft.contactDetails.email}\n\nWould you like to confirm and proceed to payment?`,
        };
    }

    private async handleReviewStep(
        draft: BookingDraftDocument,
        intent: VoiceAgentIntent,
        entities: Record<string, any>,
    ) {
        if (intent === VoiceAgentIntent.CONFIRM_BOOKING || entities.confirmed) {
            draft.currentStep = BookingDraftStep.PAYMENT;
            draft.completedSteps.push(BookingDraftStep.REVIEW);
            draft.lastInteractionAt = new Date();
            await draft.save();

            return {
                draft,
                nextStep: BookingDraftStep.PAYMENT,
                message: 'Booking confirmed! Redirecting you to the payment page. You can complete payment via Stripe or Paystack.',
            };
        }

        return {
            draft,
            nextStep: BookingDraftStep.REVIEW,
            message: 'Would you like to confirm this booking or make any changes? You can say "confirm" to proceed or "change" to modify.',
        };
    }

    private async handlePaymentStep(
        draft: BookingDraftDocument,
        intent: VoiceAgentIntent,
        entities: Record<string, any>,
    ) {
        // Create the actual booking
        try {
            const booking = await this.bookingsService.create(
                draft.user.toString(),
                {
                    flights: draft.selectedFlights.map((f) => ({
                        flight: f.flightId,
                        class: f.travelClass,
                    })),
                    contactDetails: {
                        email: draft.contactDetails?.email || '',
                        phone: draft.contactDetails?.phone || '',
                        name: draft.contactDetails?.name || '',
                    },
                    totalPassengers: draft.passengerDetails.length,
                    isRoundTrip: draft.searchCriteria.isRoundTrip,
                    notes: 'Booked via Voice Agent',
                } as any,
            );

            draft.currentStep = BookingDraftStep.CONFIRMED;
            draft.status = BookingDraftStatus.COMPLETED;
            draft.bookingId = booking._id.toString();
            draft.pnr = (booking as any).pnr;
            draft.completedSteps.push(BookingDraftStep.PAYMENT);
            draft.lastInteractionAt = new Date();
            await draft.save();

            return {
                draft,
                results: booking,
                nextStep: BookingDraftStep.CONFIRMED,
                message: `Your booking is confirmed! 🎉\nBooking Reference (PNR): ${(booking as any).pnr}\nPlease complete payment to finalize your booking.`,
            };
        } catch (error) {
            this.logger.error(`Booking creation failed: ${error.message}`);
            return {
                draft,
                nextStep: BookingDraftStep.PAYMENT,
                message: 'I encountered an issue creating your booking. Would you like to try again or speak to a support agent?',
            };
        }
    }

    // ═══════════════════════ Flow Status ═══════════════════════

    async getFlowStatus(draftId: string): Promise<{
        currentStep: BookingDraftStep;
        completedSteps: string[];
        totalSteps: number;
        progressPercent: number;
        summary: Record<string, any>;
    }> {
        const draft = await this.getDraft(draftId);
        const currentIndex = STEP_ORDER.indexOf(draft.currentStep);

        return {
            currentStep: draft.currentStep,
            completedSteps: draft.completedSteps,
            totalSteps: STEP_ORDER.length,
            progressPercent: Math.round((currentIndex / (STEP_ORDER.length - 1)) * 100),
            summary: {
                searchCriteria: draft.searchCriteria,
                selectedFlights: draft.selectedFlights.length,
                selectedStays: draft.selectedStays.length,
                passengers: draft.passengerDetails.length,
                hasContact: !!draft.contactDetails?.email,
                pricing: draft.pricing,
            },
        };
    }

    async resumeFlow(draftId: string): Promise<{
        draft: BookingDraftDocument;
        contextSummary: string;
    }> {
        const draft = await this.getDraft(draftId);
        draft.lastInteractionAt = new Date();
        await draft.save();

        const contextSummary = this.buildResumeSummary(draft);
        return { draft, contextSummary };
    }

    async abandonFlow(draftId: string): Promise<void> {
        await this.draftModel.findByIdAndUpdate(draftId, {
            status: BookingDraftStatus.ABANDONED,
            lastInteractionAt: new Date(),
        }).exec();
    }

    // ═══════════════════════ Abandoned Draft Detection ═══════════════════════

    async findAbandonedDrafts(thresholdMinutes: number = 30): Promise<BookingDraftDocument[]> {
        const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
        return this.draftModel
            .find({
                status: BookingDraftStatus.IN_PROGRESS,
                lastInteractionAt: { $lt: threshold },
                currentStep: { $ne: BookingDraftStep.CONFIRMED },
            })
            .populate('user', 'email firstName lastName')
            .limit(100)
            .exec();
    }

    async findDraftsForReminder(thresholdMinutes: number = 60): Promise<BookingDraftDocument[]> {
        const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
        const tooOld = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return this.draftModel
            .find({
                status: BookingDraftStatus.IN_PROGRESS,
                lastInteractionAt: { $lt: threshold, $gt: tooOld },
                currentStep: { $ne: BookingDraftStep.CONFIRMED },
            })
            .populate('user', 'email firstName lastName')
            .limit(50)
            .exec();
    }

    // ═══════════════════════ Helpers ═══════════════════════

    private buildResumeSummary(draft: BookingDraftDocument): string {
        const parts = ['Welcome back! Here\'s where you left off:'];

        if (draft.searchCriteria.origin && draft.searchCriteria.destination) {
            parts.push(`📍 Route: ${draft.searchCriteria.origin} → ${draft.searchCriteria.destination}`);
        }
        if (draft.searchCriteria.departureDate) {
            parts.push(`📅 Date: ${draft.searchCriteria.departureDate}`);
        }
        if (draft.selectedFlights.length) {
            parts.push(`✈️ Flight selected (${draft.selectedFlights[0].currency} ${draft.selectedFlights[0].price})`);
        }
        if (draft.selectedStays.length) {
            parts.push(`🏨 Hotel selected`);
        }
        if (draft.passengerDetails.length) {
            parts.push(`👤 ${draft.passengerDetails.length} passenger(s) added`);
        }

        const stepLabels: Record<string, string> = {
            [BookingDraftStep.SEARCH]: 'searching for flights',
            [BookingDraftStep.SELECT_FLIGHT]: 'selecting a flight',
            [BookingDraftStep.SELECT_STAY]: 'choosing accommodation',
            [BookingDraftStep.PASSENGER_DETAILS]: 'adding passenger details',
            [BookingDraftStep.CONTACT_INFO]: 'providing contact information',
            [BookingDraftStep.REVIEW]: 'reviewing your booking',
            [BookingDraftStep.PAYMENT]: 'completing payment',
        };

        parts.push(`\nNext step: ${stepLabels[draft.currentStep] || 'continue booking'}`);
        return parts.join('\n');
    }
}
