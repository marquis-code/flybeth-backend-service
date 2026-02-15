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
var AnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const cache_manager_1 = require("@nestjs/cache-manager");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const payment_schema_1 = require("../payments/schemas/payment.schema");
let AnalyticsService = AnalyticsService_1 = class AnalyticsService {
    constructor(bookingModel, paymentModel, cacheManager) {
        this.bookingModel = bookingModel;
        this.paymentModel = paymentModel;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(AnalyticsService_1.name);
    }
    async getBookingAnalytics(tenantId, days = 30) {
        const cacheKey = `analytics:bookings:${tenantId || 'all'}:${days}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached)
            return cached;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const matchStage = { createdAt: { $gte: startDate } };
        if (tenantId)
            matchStage.tenant = new mongoose_2.Types.ObjectId(tenantId);
        const [trends, statusBreakdown, dailyBookings] = await Promise.all([
            this.bookingModel.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 },
                        revenue: { $sum: '$pricing.totalAmount' },
                    },
                },
                { $sort: { _id: 1 } },
            ]).exec(),
            this.bookingModel.aggregate([
                { $match: matchStage },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]).exec(),
            this.bookingModel.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        avgPerDay: { $avg: 1 },
                    },
                },
            ]).exec(),
        ]);
        const result = { trends, statusBreakdown, summary: dailyBookings[0] || {} };
        await this.cacheManager.set(cacheKey, result, 300000);
        return result;
    }
    async getRevenueAnalytics(tenantId, days = 30) {
        const cacheKey = `analytics:revenue:${tenantId || 'all'}:${days}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached)
            return cached;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const matchStage = {
            status: 'success',
            createdAt: { $gte: startDate },
        };
        if (tenantId)
            matchStage.tenant = new mongoose_2.Types.ObjectId(tenantId);
        const [byCurrency, byPeriod, byProvider] = await Promise.all([
            this.paymentModel.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$currency',
                        total: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
            ]).exec(),
            this.paymentModel.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
                        total: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]).exec(),
            this.paymentModel.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$provider',
                        total: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
            ]).exec(),
        ]);
        const result = { byCurrency, byPeriod, byProvider };
        await this.cacheManager.set(cacheKey, result, 300000);
        return result;
    }
    async getPopularRoutes(limit = 10, tenantId) {
        const cacheKey = `analytics:routes:${tenantId || 'all'}:${limit}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached)
            return cached;
        const matchStage = {};
        if (tenantId)
            matchStage.tenant = new mongoose_2.Types.ObjectId(tenantId);
        const routes = await this.bookingModel.aggregate([
            { $match: matchStage },
            { $unwind: '$flights' },
            {
                $lookup: {
                    from: 'flights',
                    localField: 'flights.flight',
                    foreignField: '_id',
                    as: 'flightDetails',
                },
            },
            { $unwind: '$flightDetails' },
            {
                $group: {
                    _id: {
                        origin: '$flightDetails.departure.airport',
                        destination: '$flightDetails.arrival.airport',
                    },
                    count: { $sum: 1 },
                    originCity: { $first: '$flightDetails.departure.city' },
                    destinationCity: { $first: '$flightDetails.arrival.city' },
                },
            },
            { $sort: { count: -1 } },
            { $limit: limit },
        ]).exec();
        await this.cacheManager.set(cacheKey, routes, 600000);
        return routes;
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = AnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __param(1, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __param(2, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model, Object])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map