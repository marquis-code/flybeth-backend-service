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
var SchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const bookings_service_1 = require("../bookings/bookings.service");
const currency_service_1 = require("../currency/currency.service");
let SchedulerService = SchedulerService_1 = class SchedulerService {
    constructor(bookingsService, currencyService) {
        this.bookingsService = bookingsService;
        this.currencyService = currencyService;
        this.logger = new common_1.Logger(SchedulerService_1.name);
    }
    async expirePendingBookings() {
        try {
            const expired = await this.bookingsService.expireBookings();
            if (expired > 0) {
                this.logger.log(`Expired ${expired} pending bookings`);
            }
        }
        catch (error) {
            this.logger.error(`Booking expiry job failed: ${error.message}`);
        }
    }
    async refreshExchangeRates() {
        try {
            await this.currencyService.getExchangeRates('USD');
            this.logger.log('Exchange rates refreshed');
        }
        catch (error) {
            this.logger.error(`Exchange rate refresh failed: ${error.message}`);
        }
    }
};
exports.SchedulerService = SchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "expirePendingBookings", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "refreshExchangeRates", null);
exports.SchedulerService = SchedulerService = SchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService,
        currency_service_1.CurrencyService])
], SchedulerService);
//# sourceMappingURL=scheduler.service.js.map