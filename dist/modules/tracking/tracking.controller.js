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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingController = void 0;
const common_1 = require("@nestjs/common");
const tracking_service_1 = require("./tracking.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let TrackingController = class TrackingController {
    constructor(trackingService) {
        this.trackingService = trackingService;
    }
    async trackEvent(body, req) {
        const userId = req.user?.sub || null;
        return this.trackingService.logUserJourney(userId, body.event, body.metadata, req.ip, req.headers['user-agent']);
    }
    async flightStatusWebhook(body) {
        return this.trackingService.logFlightStatus(body.pnr, body.status, body.details);
    }
    async getMyHistory(req) {
        return this.trackingService.getUserHistory(req.user.sub);
    }
    async getFlightHistory(pnr) {
        return this.trackingService.getFlightHistory(pnr);
    }
};
exports.TrackingController = TrackingController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('event'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "trackEvent", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('webhook/flight-status'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "flightStatusWebhook", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "getMyHistory", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('flight/:pnr'),
    __param(0, (0, common_1.Param)('pnr')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "getFlightHistory", null);
exports.TrackingController = TrackingController = __decorate([
    (0, common_1.Controller)('tracking'),
    __metadata("design:paramtypes", [tracking_service_1.TrackingService])
], TrackingController);
//# sourceMappingURL=tracking.controller.js.map