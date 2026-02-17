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
var BookingReminderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingReminderService = void 0;
const common_1 = require("@nestjs/common");
const booking_flow_service_1 = require("./booking-flow.service");
const notifications_service_1 = require("../../notifications/notifications.service");
const roles_constant_1 = require("../../../common/constants/roles.constant");
const schedule_1 = require("@nestjs/schedule");
let BookingReminderService = BookingReminderService_1 = class BookingReminderService {
    constructor(bookingFlowService, notificationsService) {
        this.bookingFlowService = bookingFlowService;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(BookingReminderService_1.name);
    }
    async checkAbandonedDrafts() {
        this.logger.log('Checking for abandoned booking drafts...');
        const drafts = await this.bookingFlowService.findAbandonedDrafts(30);
        for (const draft of drafts) {
            try {
                await this.notificationsService.createNotification({
                    userId: draft.user._id.toString(),
                    type: roles_constant_1.NotificationType.DRAFT_ABANDONED,
                    title: 'Complete your booking',
                    message: `You left off while ${this.getStepDescription(draft.currentStep)}. Tap to resume!`,
                    data: { draftId: draft._id, step: draft.currentStep },
                });
                await this.bookingFlowService.abandonFlow(draft._id.toString());
            }
            catch (error) {
                this.logger.error(`Failed to send reminder for draft ${draft._id}: ${error.message}`);
            }
        }
    }
    getStepDescription(step) {
        const descriptions = {
            search: 'searching for flights',
            select_flight: 'selecting your flight',
            select_stay: 'choosing a hotel',
            passenger_details: 'adding passengers',
            payment: 'making payment',
        };
        return descriptions[step] || 'booking your trip';
    }
};
exports.BookingReminderService = BookingReminderService;
__decorate([
    (0, schedule_1.Cron)('*/30 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookingReminderService.prototype, "checkAbandonedDrafts", null);
exports.BookingReminderService = BookingReminderService = BookingReminderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [booking_flow_service_1.BookingFlowService,
        notifications_service_1.NotificationsService])
], BookingReminderService);
//# sourceMappingURL=booking-reminder.service.js.map