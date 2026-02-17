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
var AIEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIEngineService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const assemblyai_service_1 = require("./assemblyai.service");
const roles_constant_1 = require("../../../common/constants/roles.constant");
const booking_draft_schema_1 = require("../schemas/booking-draft.schema");
let AIEngineService = AIEngineService_1 = class AIEngineService {
    constructor(assemblyAIService, draftModel) {
        this.assemblyAIService = assemblyAIService;
        this.draftModel = draftModel;
        this.logger = new common_1.Logger(AIEngineService_1.name);
        this.SYSTEM_PROMPT = `You are FlyBeth AI, an intelligent travel booking assistant. You help users search for flights, hotels, car rentals, cruises, and vacation packages.

Your capabilities:
1. SEARCH: Help users find flights, stays, cars, and cruises
2. BOOK: Guide users through the booking process step by step
3. STATUS: Check booking statuses and provide updates
4. SUPPORT: Answer travel-related questions and resolve issues
5. RECOMMEND: Suggest personalized travel options based on preferences

Guidelines:
- Always be friendly, concise, and professional
- When users mention travel plans, extract: origin, destination, dates, number of passengers, and travel class
- If information is missing, ask clarifying questions one at a time
- Provide clear summaries of search results and options
- Guide users through the booking flow naturally
- For dates, parse natural language (e.g., "next Friday", "March 15") into specific dates
- Always confirm details before proceeding to the next step
- Mention current promotions or deals when relevant

Response format: Always respond in natural, conversational language. Keep responses under 3 sentences unless explaining search results.`;
        this.INTENT_PARSE_PROMPT = `Analyze the user message and extract the intent and entities. Respond ONLY with valid JSON, no markdown.

Possible intents: search_flight, search_stay, search_car, search_cruise, search_package, select_option, add_passenger, set_contact, confirm_booking, check_status, cancel_booking, get_help, get_recommendations, general_query, unknown

Extract entities when present:
- origin: departure city/airport
- destination: arrival city/airport
- departureDate: departure date (YYYY-MM-DD format)
- returnDate: return date (YYYY-MM-DD format)
- passengers: number of passengers
- adults: number of adults
- children: number of children
- travelClass: economy/business/first
- bookingRef: booking reference/PNR
- checkIn: check-in date
- checkOut: check-out date
- selectedIndex: index of selected option (0-based)

Response format (JSON only):
{"intent":"<intent>","confidence":0.95,"entities":{"origin":"Lagos","destination":"London","departureDate":"2026-03-15","passengers":2}}`;
    }
    async parseIntent(text, conversationHistory = []) {
        try {
            const messages = [
                { role: 'system', content: this.INTENT_PARSE_PROMPT },
                ...conversationHistory.slice(-4).map((m) => ({
                    role: m.role === roles_constant_1.ConversationRole.USER ? 'user' : 'assistant',
                    content: m.content,
                })),
                { role: 'user', content: text },
            ];
            const response = await this.assemblyAIService.chatCompletion(messages, {
                temperature: 0.1,
                maxTokens: 256,
            });
            const parsed = JSON.parse(response.content);
            return {
                intent: parsed.intent || roles_constant_1.VoiceAgentIntent.UNKNOWN,
                confidence: parsed.confidence || 0.5,
                entities: parsed.entities || {},
                rawText: text,
            };
        }
        catch (error) {
            this.logger.warn(`Intent parsing failed, defaulting: ${error.message}`);
            return {
                intent: roles_constant_1.VoiceAgentIntent.GENERAL_QUERY,
                confidence: 0.3,
                entities: {},
                rawText: text,
            };
        }
    }
    async generateResponse(intent, data, conversationHistory = []) {
        try {
            const contextMessage = this.buildContextMessage(intent, data);
            const messages = [
                { role: 'system', content: this.SYSTEM_PROMPT },
                ...conversationHistory.slice(-6).map((m) => ({
                    role: m.role === roles_constant_1.ConversationRole.USER ? 'user' : 'assistant',
                    content: m.content,
                })),
                { role: 'user', content: contextMessage },
            ];
            const response = await this.assemblyAIService.chatCompletion(messages, {
                temperature: 0.7,
                maxTokens: 512,
            });
            return response.content;
        }
        catch (error) {
            this.logger.error(`Response generation failed: ${error.message}`);
            return this.getFallbackResponse(intent);
        }
    }
    async getRecommendations(userId, searchHistory = [], currentDraft) {
        try {
            const context = {
                searchHistory: searchHistory.slice(-5),
                currentDraft: currentDraft
                    ? {
                        step: currentDraft.currentStep,
                        searchCriteria: currentDraft.searchCriteria,
                        selectedFlights: currentDraft.selectedFlights.length,
                        selectedStays: currentDraft.selectedStays.length,
                    }
                    : null,
            };
            const messages = [
                {
                    role: 'system',
                    content: `${this.SYSTEM_PROMPT}\n\nAdditional context: Generate personalized travel recommendations based on the user's search history and current booking state. Suggest destinations, travel dates, or package deals. Be specific and actionable.`,
                },
                {
                    role: 'user',
                    content: `Based on this user profile, suggest 3 personalized travel recommendations:\n${JSON.stringify(context, null, 2)}`,
                },
            ];
            const response = await this.assemblyAIService.chatCompletion(messages, {
                temperature: 0.8,
                maxTokens: 512,
            });
            return response.content;
        }
        catch (error) {
            this.logger.error(`Recommendations failed: ${error.message}`);
            return 'I can suggest some popular destinations! Would you like to see trending flights, hotel deals, or vacation packages?';
        }
    }
    async handleSupportQuery(query, context) {
        try {
            const messages = [
                {
                    role: 'system',
                    content: `${this.SYSTEM_PROMPT}\n\nYou are now in SUPPORT mode. Answer travel and booking related questions. If the issue requires human assistance (e.g., complex refunds, legal disputes, complaints about staff), set needsEscalation to true.

Respond ONLY with valid JSON:
{"answer":"<your response>","needsEscalation":false,"category":"<faq|booking|billing|technical|general>"}`,
                },
                ...(context.conversationHistory || []).slice(-4).map((m) => ({
                    role: m.role === roles_constant_1.ConversationRole.USER ? 'user' : 'assistant',
                    content: m.content,
                })),
                {
                    role: 'user',
                    content: context.bookingData
                        ? `Question: ${query}\nBooking context: ${JSON.stringify(context.bookingData)}`
                        : query,
                },
            ];
            const response = await this.assemblyAIService.chatCompletion(messages, {
                temperature: 0.3,
                maxTokens: 512,
            });
            const parsed = JSON.parse(response.content);
            return {
                answer: parsed.answer || response.content,
                needsEscalation: parsed.needsEscalation || false,
                category: parsed.category || 'general',
            };
        }
        catch (error) {
            this.logger.error(`Support query failed: ${error.message}`);
            return {
                answer: 'I apologize, but I\'m having trouble processing your request. Let me connect you with a support agent who can help.',
                needsEscalation: true,
                category: 'technical',
            };
        }
    }
    async analyzeDisruption(flightStatus, bookingData) {
        try {
            const messages = [
                {
                    role: 'system',
                    content: `Analyze this flight disruption and provide a passenger-friendly notification. Respond ONLY with valid JSON:
{"severity":"<low|medium|high|critical>","message":"<passenger notification>","suggestions":["<action item 1>","<action item 2>"]}

Severity guide:
- low: Minor delay < 30 min
- medium: Delay 30-120 min or gate change
- high: Delay > 120 min or cancellation with alternatives
- critical: Cancellation with no alternatives`,
                },
                {
                    role: 'user',
                    content: `Flight status: ${JSON.stringify(flightStatus)}\nBooking: ${JSON.stringify(bookingData)}`,
                },
            ];
            const response = await this.assemblyAIService.chatCompletion(messages, {
                temperature: 0.2,
                maxTokens: 256,
            });
            return JSON.parse(response.content);
        }
        catch (error) {
            this.logger.error(`Disruption analysis failed: ${error.message}`);
            return {
                severity: 'medium',
                message: 'There has been an update to your flight. Please check your booking for details.',
                suggestions: ['Check the airline\'s website for the latest status', 'Contact support if you need assistance'],
            };
        }
    }
    buildContextMessage(intent, data) {
        switch (intent) {
            case roles_constant_1.VoiceAgentIntent.SEARCH_FLIGHT:
                return `The user wants to search for flights. Search criteria: ${JSON.stringify(data.searchCriteria || data.entities)}. ${data.results ? `Here are the results:\n${JSON.stringify(data.results.slice(0, 5))}` : 'Searching...'}`;
            case roles_constant_1.VoiceAgentIntent.SEARCH_STAY:
                return `The user wants to find hotels/stays. Criteria: ${JSON.stringify(data.searchCriteria || data.entities)}. ${data.results ? `Results:\n${JSON.stringify(data.results.slice(0, 5))}` : 'Searching...'}`;
            case roles_constant_1.VoiceAgentIntent.SELECT_OPTION:
                return `The user selected option ${data.selectedIndex}. Here are the options they chose from: ${JSON.stringify(data.options?.slice(0, 5))}. Selected: ${JSON.stringify(data.selected)}`;
            case roles_constant_1.VoiceAgentIntent.ADD_PASSENGER:
                return `The user is adding passenger details: ${JSON.stringify(data.entities)}. Current passengers: ${data.currentPassengers || 0}/${data.totalRequired || 1}`;
            case roles_constant_1.VoiceAgentIntent.SET_CONTACT:
                return `The user is providing contact details: ${JSON.stringify(data.entities)}`;
            case roles_constant_1.VoiceAgentIntent.CONFIRM_BOOKING:
                return `The user wants to confirm their booking. Summary: ${JSON.stringify(data.summary)}`;
            case roles_constant_1.VoiceAgentIntent.CHECK_STATUS:
                return `The user wants to check booking status. ${data.booking ? `Booking info: PNR=${data.booking.pnr}, Status=${data.booking.status}` : 'No booking found.'}`;
            case roles_constant_1.VoiceAgentIntent.GET_RECOMMENDATIONS:
                return `The user wants travel recommendations. ${data.recommendations || 'Generate some recommendations.'}`;
            case roles_constant_1.VoiceAgentIntent.GET_HELP:
                return `The user needs help: ${data.rawText}. ${data.bookingContext ? `Booking context: ${JSON.stringify(data.bookingContext)}` : ''}`;
            default:
                return `User message: ${data.rawText || JSON.stringify(data)}`;
        }
    }
    getFallbackResponse(intent) {
        const fallbacks = {
            [roles_constant_1.VoiceAgentIntent.SEARCH_FLIGHT]: 'I\'d love to help you find flights! Where would you like to fly from and to? And when are you planning to travel?',
            [roles_constant_1.VoiceAgentIntent.SEARCH_STAY]: 'Let me help you find accommodation! What city are you looking for, and what are your check-in and check-out dates?',
            [roles_constant_1.VoiceAgentIntent.SEARCH_CAR]: 'I can help with car rentals! Where do you need a car, and for what dates?',
            [roles_constant_1.VoiceAgentIntent.CHECK_STATUS]: 'I can check your booking status. Could you provide your booking reference (PNR)?',
            [roles_constant_1.VoiceAgentIntent.GET_HELP]: 'I\'m here to help! Could you tell me more about what you need assistance with?',
            [roles_constant_1.VoiceAgentIntent.GET_RECOMMENDATIONS]: 'Let me suggest some great travel options for you!',
        };
        return fallbacks[intent] || 'How can I help you with your travel plans today?';
    }
};
exports.AIEngineService = AIEngineService;
exports.AIEngineService = AIEngineService = AIEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(booking_draft_schema_1.BookingDraft.name)),
    __metadata("design:paramtypes", [assemblyai_service_1.AssemblyAIService,
        mongoose_2.Model])
], AIEngineService);
//# sourceMappingURL=ai-engine.service.js.map