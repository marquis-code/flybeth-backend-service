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
var AISupportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AISupportService = void 0;
const common_1 = require("@nestjs/common");
const ai_engine_service_1 = require("./ai-engine.service");
const bookings_service_1 = require("../../bookings/bookings.service");
const notifications_service_1 = require("../../notifications/notifications.service");
const config_1 = require("@nestjs/config");
let AISupportService = AISupportService_1 = class AISupportService {
    constructor(aiEngineService, bookingsService, notificationsService, configService) {
        this.aiEngineService = aiEngineService;
        this.bookingsService = bookingsService;
        this.notificationsService = notificationsService;
        this.configService = configService;
        this.logger = new common_1.Logger(AISupportService_1.name);
    }
    async handleSupportQuery(userId, query, context = {}) {
        let bookingData = null;
        if (context.bookingId) {
            try {
                const booking = await this.bookingsService.findById(context.bookingId);
                bookingData = {
                    pnr: booking.pnr,
                    status: booking.status,
                    flights: booking.flights,
                    totalAmount: booking.pricing?.totalAmount,
                };
            }
            catch (e) {
                this.logger.warn(`Could not fetch booking context: ${e.message}`);
            }
        }
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
    async escalateToHumanAgent(userId, issue, category) {
        this.logger.log(`Escalating issue for user ${userId}: ${issue} (${category})`);
        await this.notificationsService.createNotification({
            userId,
            title: `Support Escalation: ${category}`,
            message: `User needs help: ${issue}`,
            type: 'system',
            data: { userId, issue, category, timestamp: new Date() },
        });
        const supportEmail = this.configService.get('SMTP_USER');
        if (supportEmail) {
            await this.notificationsService.sendEmail(supportEmail, `Urgent: User Escalation (${category})`, `<p>User ID: ${userId}</p><p>Issue: ${issue}</p><p>Category: ${category}</p>`);
        }
    }
    async getFAQAnswer(question) {
        const result = await this.aiEngineService.handleSupportQuery(question, {
            userId: 'anonymous',
        });
        return result.answer;
    }
};
exports.AISupportService = AISupportService;
exports.AISupportService = AISupportService = AISupportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_engine_service_1.AIEngineService,
        bookings_service_1.BookingsService,
        notifications_service_1.NotificationsService,
        config_1.ConfigService])
], AISupportService);
//# sourceMappingURL=ai-support.service.js.map