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
var TrackingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const tracking_event_schema_1 = require("./schemas/tracking-event.schema");
let TrackingService = TrackingService_1 = class TrackingService {
    constructor(eventModel) {
        this.eventModel = eventModel;
        this.logger = new common_1.Logger(TrackingService_1.name);
    }
    async logUserJourney(userId, event, metadata = {}, ip, agent) {
        const log = new this.eventModel({
            type: 'user_journey',
            entityId: userId || 'anonymous',
            user: userId,
            event,
            metadata,
            ipAddress: ip,
            userAgent: agent,
        });
        return log.save();
    }
    async logFlightStatus(pnr, status, details) {
        this.logger.log(`Flight status update for PNR ${pnr}: ${status}`);
        const log = new this.eventModel({
            type: 'flight_status',
            entityId: pnr,
            event: status,
            metadata: details,
        });
        return log.save();
    }
    async getUserHistory(userId) {
        return this.eventModel
            .find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(100)
            .exec();
    }
    async getFlightHistory(pnr) {
        return this.eventModel
            .find({ type: 'flight_status', entityId: pnr })
            .sort({ createdAt: -1 })
            .exec();
    }
};
exports.TrackingService = TrackingService;
exports.TrackingService = TrackingService = TrackingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(tracking_event_schema_1.TrackingEvent.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], TrackingService);
//# sourceMappingURL=tracking.service.js.map