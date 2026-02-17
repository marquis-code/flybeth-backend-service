"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BookingFlowService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingFlowService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const booking_draft_schema_1 = require("../schemas/booking-draft.schema");
const roles_constant_1 = require("../../../common/constants/roles.constant");
const flights_service_1 = require("../../flights/flights.service");
const flights_integration_service_1 = require("../../integrations/flights-integration.service");
const stays_service_1 = require("../../stays/stays.service");
const bookings_service_1 = require("../../bookings/bookings.service");
const STEP_ORDER = [
    roles_constant_1.BookingDraftStep.SEARCH,
    roles_constant_1.BookingDraftStep.SELECT_FLIGHT,
    roles_constant_1.BookingDraftStep.SELECT_STAY,
    roles_constant_1.BookingDraftStep.PASSENGER_DETAILS,
    roles_constant_1.BookingDraftStep.CONTACT_INFO,
    roles_constant_1.BookingDraftStep.REVIEW,
    roles_constant_1.BookingDraftStep.PAYMENT,
    roles_constant_1.BookingDraftStep.CONFIRMED,
];
let BookingFlowService = BookingFlowService_1 = class BookingFlowService {
    constructor(draftModel, flightsService, flightsIntegrationService, staysService, bookingsService) {
        this.draftModel = draftModel;
        this.flightsService = flightsService;
        this.flightsIntegrationService = flightsIntegrationService;
        this.staysService = staysService;
        this.bookingsService = bookingsService;
        this.logger = new common_1.Logger(BookingFlowService_1.name);
    }
    async startFlow(userId, voiceSessionId) {
        const draft = new this.draftModel({
            user: new mongoose_2.Types.ObjectId(userId),
            status: roles_constant_1.BookingDraftStatus.IN_PROGRESS,
            currentStep: roles_constant_1.BookingDraftStep.SEARCH,
            lastInteractionAt: new Date(),
            voiceSessionId: voiceSessionId
                ? new mongoose_2.Types.ObjectId(voiceSessionId)
                : undefined,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        return draft.save();
    }
    async getOrCreateDraft(userId, voiceSessionId) {
        const existing = await this.draftModel
            .findOne({
            user: new mongoose_2.Types.ObjectId(userId),
            status: roles_constant_1.BookingDraftStatus.IN_PROGRESS,
        })
            .sort({ lastInteractionAt: -1 })
            .exec();
        if (existing) {
            existing.lastInteractionAt = new Date();
            return existing.save();
        }
        return this.startFlow(userId, voiceSessionId);
    }
    async getDraft(draftId) {
        const draft = await this.draftModel.findById(draftId).exec();
        if (!draft) {
            throw new common_1.NotFoundException(`Booking draft ${draftId} not found`);
        }
        return draft;
    }
    async getUserDrafts(userId) {
        return this.draftModel
            .find({
            user: new mongoose_2.Types.ObjectId(userId),
            status: { $in: [roles_constant_1.BookingDraftStatus.IN_PROGRESS] },
        })
            .sort({ lastInteractionAt: -1 })
            .limit(10)
            .exec();
    }
    async processStep(draftId, intent, entities) {
        const draft = await this.getDraft(draftId);
        switch (draft.currentStep) {
            case roles_constant_1.BookingDraftStep.SEARCH:
                return this.handleSearchStep(draft, intent, entities);
            case roles_constant_1.BookingDraftStep.SELECT_FLIGHT:
                return this.handleSelectFlightStep(draft, intent, entities);
            case roles_constant_1.BookingDraftStep.SELECT_STAY:
                return this.handleSelectStayStep(draft, intent, entities);
            case roles_constant_1.BookingDraftStep.PASSENGER_DETAILS:
                return this.handlePassengerStep(draft, intent, entities);
            case roles_constant_1.BookingDraftStep.CONTACT_INFO:
                return this.handleContactStep(draft, intent, entities);
            case roles_constant_1.BookingDraftStep.REVIEW:
                return this.handleReviewStep(draft, intent, entities);
            case roles_constant_1.BookingDraftStep.PAYMENT:
                return this.handlePaymentStep(draft, intent, entities);
            default:
                return {
                    draft,
                    nextStep: draft.currentStep,
                    message: 'Your booking is already complete!',
                };
        }
    }
    async handleSearchStep(draft, intent, entities) {
        if (entities.origin)
            draft.searchCriteria.origin = entities.origin;
        if (entities.destination)
            draft.searchCriteria.destination = entities.destination;
        if (entities.departureDate)
            draft.searchCriteria.departureDate = entities.departureDate;
        if (entities.returnDate) {
            draft.searchCriteria.returnDate = entities.returnDate;
            draft.searchCriteria.isRoundTrip = true;
        }
        if (entities.passengers)
            draft.searchCriteria.adults = entities.passengers;
        if (entities.adults)
            draft.searchCriteria.adults = entities.adults;
        if (entities.children)
            draft.searchCriteria.children = entities.children;
        if (entities.travelClass)
            draft.searchCriteria.travelClass = entities.travelClass;
        const criteria = draft.searchCriteria;
        if (!criteria.origin || !criteria.destination) {
            draft.lastInteractionAt = new Date();
            await draft.save();
            return {
                draft,
                nextStep: roles_constant_1.BookingDraftStep.SEARCH,
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
                nextStep: roles_constant_1.BookingDraftStep.SEARCH,
                message: 'When would you like to depart?',
            };
        }
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
            });
        }
        catch (error) {
            this.logger.warn(`Amadeus search failed, trying local: ${error.message}`);
            results = await this.flightsService.search({
                origin: criteria.origin,
                destination: criteria.destination,
                departureDate: criteria.departureDate,
            });
        }
        draft.searchResults = Array.isArray(results?.data) ? results.data : (results?.data || []);
        draft.currentStep = roles_constant_1.BookingDraftStep.SELECT_FLIGHT;
        draft.completedSteps.push(roles_constant_1.BookingDraftStep.SEARCH);
        draft.lastInteractionAt = new Date();
        await draft.save();
        return {
            draft,
            results: draft.searchResults,
            nextStep: roles_constant_1.BookingDraftStep.SELECT_FLIGHT,
            message: `I found ${draft.searchResults.length} flights from ${criteria.origin} to ${criteria.destination}. Which one would you like to book?`,
        };
    }
    async handleSelectFlightStep(draft, intent, entities) {
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
            draft.currentStep = roles_constant_1.BookingDraftStep.SELECT_STAY;
            draft.completedSteps.push(roles_constant_1.BookingDraftStep.SELECT_FLIGHT);
            draft.lastInteractionAt = new Date();
            await draft.save();
            return {
                draft,
                nextStep: roles_constant_1.BookingDraftStep.SELECT_STAY,
                message: 'Flight selected! Would you also like to add a hotel to your booking? Say "skip" to continue without a hotel.',
            };
        }
        return {
            draft,
            nextStep: roles_constant_1.BookingDraftStep.SELECT_FLIGHT,
            message: 'I couldn\'t find that option. Could you tell me which flight number you\'d like to select?',
        };
    }
    async handleSelectStayStep(draft, intent, entities) {
        if (entities.skip ||
            intent === roles_constant_1.VoiceAgentIntent.GENERAL_QUERY &&
                (entities.rawText || '').toLowerCase().includes('skip')) {
            draft.currentStep = roles_constant_1.BookingDraftStep.PASSENGER_DETAILS;
            draft.completedSteps.push(roles_constant_1.BookingDraftStep.SELECT_STAY);
            draft.lastInteractionAt = new Date();
            await draft.save();
            return {
                draft,
                nextStep: roles_constant_1.BookingDraftStep.PASSENGER_DETAILS,
                message: 'No problem! Let\'s add passenger details. Please provide the first passenger\'s full name and date of birth.',
            };
        }
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
        if (!draft.searchResults?.length || intent === roles_constant_1.VoiceAgentIntent.SEARCH_STAY) {
            try {
                const stays = await this.staysService.search({
                    location: entities.destination || draft.searchCriteria.destination,
                    checkIn: entities.checkIn || draft.searchCriteria.departureDate,
                    checkOut: entities.checkOut || draft.searchCriteria.returnDate,
                });
                draft.searchResults = Array.isArray(stays) ? stays : [];
            }
            catch {
                draft.searchResults = [];
            }
        }
        draft.currentStep = roles_constant_1.BookingDraftStep.PASSENGER_DETAILS;
        draft.completedSteps.push(roles_constant_1.BookingDraftStep.SELECT_STAY);
        draft.lastInteractionAt = new Date();
        await draft.save();
        return {
            draft,
            nextStep: roles_constant_1.BookingDraftStep.PASSENGER_DETAILS,
            message: 'Now let\'s add passenger details. Please provide the first passenger\'s full name and date of birth.',
        };
    }
    async handlePassengerStep(draft, intent, entities) {
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
                nextStep: roles_constant_1.BookingDraftStep.PASSENGER_DETAILS,
                message: `Passenger ${current} added. Please provide details for passenger ${current + 1} of ${totalRequired}.`,
            };
        }
        draft.currentStep = roles_constant_1.BookingDraftStep.CONTACT_INFO;
        draft.completedSteps.push(roles_constant_1.BookingDraftStep.PASSENGER_DETAILS);
        draft.lastInteractionAt = new Date();
        await draft.save();
        return {
            draft,
            nextStep: roles_constant_1.BookingDraftStep.CONTACT_INFO,
            message: 'All passengers added! Now I need your contact details — email address and phone number, please.',
        };
    }
    async handleContactStep(draft, intent, entities) {
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
                nextStep: roles_constant_1.BookingDraftStep.CONTACT_INFO,
                message: 'What\'s your email address for the booking confirmation?',
            };
        }
        if (!draft.contactDetails.phone) {
            draft.lastInteractionAt = new Date();
            await draft.save();
            return {
                draft,
                nextStep: roles_constant_1.BookingDraftStep.CONTACT_INFO,
                message: 'And your phone number?',
            };
        }
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
        draft.currentStep = roles_constant_1.BookingDraftStep.REVIEW;
        draft.completedSteps.push(roles_constant_1.BookingDraftStep.CONTACT_INFO);
        draft.lastInteractionAt = new Date();
        await draft.save();
        return {
            draft,
            nextStep: roles_constant_1.BookingDraftStep.REVIEW,
            message: `Here's your booking summary:\n• Flights: ${draft.pricing.currency} ${draft.pricing.flightTotal}\n• Total: ${draft.pricing.currency} ${draft.pricing.totalAmount}\n• Passengers: ${draft.passengerDetails.length}\n• Contact: ${draft.contactDetails.email}\n\nWould you like to confirm and proceed to payment?`,
        };
    }
    async handleReviewStep(draft, intent, entities) {
        if (intent === roles_constant_1.VoiceAgentIntent.CONFIRM_BOOKING || entities.confirmed) {
            draft.currentStep = roles_constant_1.BookingDraftStep.PAYMENT;
            draft.completedSteps.push(roles_constant_1.BookingDraftStep.REVIEW);
            draft.lastInteractionAt = new Date();
            await draft.save();
            return {
                draft,
                nextStep: roles_constant_1.BookingDraftStep.PAYMENT,
                message: 'Booking confirmed! Redirecting you to the payment page. You can complete payment via Stripe or Paystack.',
            };
        }
        return {
            draft,
            nextStep: roles_constant_1.BookingDraftStep.REVIEW,
            message: 'Would you like to confirm this booking or make any changes? You can say "confirm" to proceed or "change" to modify.',
        };
    }
    async handlePaymentStep(draft, intent, entities) {
        try {
            const booking = await this.bookingsService.create(draft.user.toString(), {
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
            });
            draft.currentStep = roles_constant_1.BookingDraftStep.CONFIRMED;
            draft.status = roles_constant_1.BookingDraftStatus.COMPLETED;
            draft.bookingId = booking._id.toString();
            draft.pnr = booking.pnr;
            draft.completedSteps.push(roles_constant_1.BookingDraftStep.PAYMENT);
            draft.lastInteractionAt = new Date();
            await draft.save();
            return {
                draft,
                results: booking,
                nextStep: roles_constant_1.BookingDraftStep.CONFIRMED,
                message: `Your booking is confirmed! 🎉\nBooking Reference (PNR): ${booking.pnr}\nPlease complete payment to finalize your booking.`,
            };
        }
        catch (error) {
            this.logger.error(`Booking creation failed: ${error.message}`);
            return {
                draft,
                nextStep: roles_constant_1.BookingDraftStep.PAYMENT,
                message: 'I encountered an issue creating your booking. Would you like to try again or speak to a support agent?',
            };
        }
    }
    async getFlowStatus(draftId) {
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
    async resumeFlow(draftId) {
        const draft = await this.getDraft(draftId);
        draft.lastInteractionAt = new Date();
        await draft.save();
        const contextSummary = this.buildResumeSummary(draft);
        return { draft, contextSummary };
    }
    async abandonFlow(draftId) {
        await this.draftModel.findByIdAndUpdate(draftId, {
            status: roles_constant_1.BookingDraftStatus.ABANDONED,
            lastInteractionAt: new Date(),
        }).exec();
    }
    async findAbandonedDrafts(thresholdMinutes = 30) {
        const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
        return this.draftModel
            .find({
            status: roles_constant_1.BookingDraftStatus.IN_PROGRESS,
            lastInteractionAt: { $lt: threshold },
            currentStep: { $ne: roles_constant_1.BookingDraftStep.CONFIRMED },
        })
            .populate('user', 'email firstName lastName')
            .limit(100)
            .exec();
    }
    async findDraftsForReminder(thresholdMinutes = 60) {
        const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
        const tooOld = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return this.draftModel
            .find({
            status: roles_constant_1.BookingDraftStatus.IN_PROGRESS,
            lastInteractionAt: { $lt: threshold, $gt: tooOld },
            currentStep: { $ne: roles_constant_1.BookingDraftStep.CONFIRMED },
        })
            .populate('user', 'email firstName lastName')
            .limit(50)
            .exec();
    }
    buildResumeSummary(draft) {
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
        const stepLabels = {
            [roles_constant_1.BookingDraftStep.SEARCH]: 'searching for flights',
            [roles_constant_1.BookingDraftStep.SELECT_FLIGHT]: 'selecting a flight',
            [roles_constant_1.BookingDraftStep.SELECT_STAY]: 'choosing accommodation',
            [roles_constant_1.BookingDraftStep.PASSENGER_DETAILS]: 'adding passenger details',
            [roles_constant_1.BookingDraftStep.CONTACT_INFO]: 'providing contact information',
            [roles_constant_1.BookingDraftStep.REVIEW]: 'reviewing your booking',
            [roles_constant_1.BookingDraftStep.PAYMENT]: 'completing payment',
        };
        parts.push(`\nNext step: ${stepLabels[draft.currentStep] || 'continue booking'}`);
        return parts.join('\n');
    }
};
exports.BookingFlowService = BookingFlowService;
exports.BookingFlowService = BookingFlowService = BookingFlowService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(booking_draft_schema_1.BookingDraft.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        flights_service_1.FlightsService,
        flights_integration_service_1.FlightsIntegrationService,
        stays_service_1.StaysService,
        bookings_service_1.BookingsService])
], BookingFlowService);
//# sourceMappingURL=booking-flow.service.js.map