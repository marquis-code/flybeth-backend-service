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
var DisruptionAlertService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisruptionAlertService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const booking_schema_1 = require("../../bookings/schemas/booking.schema");
const roles_constant_1 = require("../../../common/constants/roles.constant");
const flights_integration_service_1 = require("../../integrations/flights-integration.service");
const notifications_service_1 = require("../../notifications/notifications.service");
const ai_engine_service_1 = require("./ai-engine.service");
const schedule_1 = require("@nestjs/schedule");
let DisruptionAlertService = DisruptionAlertService_1 = class DisruptionAlertService {
    constructor(bookingModel, flightsIntegrationService, notificationsService, aiEngineService) {
        this.bookingModel = bookingModel;
        this.flightsIntegrationService = flightsIntegrationService;
        this.notificationsService = notificationsService;
        this.aiEngineService = aiEngineService;
        this.logger = new common_1.Logger(DisruptionAlertService_1.name);
    }
    async monitorActiveFlights() {
        this.logger.log('Starting disruption monitoring...');
        const now = new Date();
        const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const bookings = await this.bookingModel.find({
            status: { $in: [roles_constant_1.BookingStatus.CONFIRMED, roles_constant_1.BookingStatus.TICKETED] },
            'flights.0': { $exists: true },
        }).populate('flights.flight').exec();
        for (const booking of bookings) {
            const firstFlight = booking.flights[0]?.flight;
            if (!firstFlight || !firstFlight.departure?.at)
                continue;
            const departureTime = new Date(firstFlight.departure.at);
            if (departureTime < now || departureTime > next24h)
                continue;
            try {
                const status = await this.flightsIntegrationService.onDemandFlightStatus({
                    carrierCode: firstFlight.carrierCode,
                    flightNumber: firstFlight.number,
                    scheduledDepartureDate: departureTime.toISOString().split('T')[0],
                });
                if (this.isDisrupted(status)) {
                    await this.handleDisruption(booking, status, firstFlight);
                }
            }
            catch (error) {
                this.logger.error(`Error checking flight status for ${booking.pnr}: ${error.message}`);
            }
        }
    }
    isDisrupted(status) {
        const flightStatus = status?.data?.[0]?.flightStatus;
        return flightStatus === 'CANCELLED' || flightStatus === 'DIVERTED' ||
            (status?.data?.[0]?.legs?.[0]?.departure?.actual &&
                this.calculateDelay(status) > 30);
    }
    calculateDelay(status) {
        return 0;
    }
    async handleDisruption(booking, status, flight) {
        const analysis = await this.aiEngineService.analyzeDisruption(status, booking);
        await this.notificationsService.createNotification({
            userId: booking.user.toString(),
            type: roles_constant_1.NotificationType.FLIGHT_DISRUPTION,
            title: `Flight Alert: ${flight.carrierCode}${flight.number}`,
            message: analysis.message,
            channel: 'push',
            data: {
                pnr: booking.pnr,
                severity: analysis.severity,
                suggestions: analysis.suggestions,
                statusRaw: status,
            },
        });
        if (analysis.severity === 'high' || analysis.severity === 'critical') {
            await this.notificationsService.sendEmail(booking.contactDetails.email, `URGENT: Flight Disruption Alert (${booking.pnr})`, `<p>${analysis.message}</p><ul>${analysis.suggestions.map(s => `<li>${s}</li>`).join('')}</ul>`);
        }
        this.logger.warn(`Disruption alert sent for booking ${booking.pnr} (${analysis.severity})`);
    }
};
exports.DisruptionAlertService = DisruptionAlertService;
__decorate([
    (0, schedule_1.Cron)('*/15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DisruptionAlertService.prototype, "monitorActiveFlights", null);
exports.DisruptionAlertService = DisruptionAlertService = DisruptionAlertService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        flights_integration_service_1.FlightsIntegrationService,
        notifications_service_1.NotificationsService,
        ai_engine_service_1.AIEngineService])
], DisruptionAlertService);
//# sourceMappingURL=disruption-alert.service.js.map