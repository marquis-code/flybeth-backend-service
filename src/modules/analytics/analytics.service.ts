// src/modules/analytics/analytics.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Booking } from '../bookings/schemas/booking.schema';
import { Payment } from '../payments/schemas/payment.schema';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(
        @InjectModel(Booking.name) private bookingModel: Model<Booking>,
        @InjectModel(Payment.name) private paymentModel: Model<Payment>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async getBookingAnalytics(tenantId?: string, days: number = 30) {
        const cacheKey = `analytics:bookings:${tenantId || 'all'}:${days}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) return cached;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const matchStage: any = { createdAt: { $gte: startDate } };
        if (tenantId) matchStage.tenant = new Types.ObjectId(tenantId);

        const [trends, statusBreakdown, dailyBookings] = await Promise.all([
            // Booking trend
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

            // Status breakdown
            this.bookingModel.aggregate([
                { $match: matchStage },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]).exec(),

            // Average daily bookings
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
        await this.cacheManager.set(cacheKey, result, 300000); // 5 min cache
        return result;
    }

    async getRevenueAnalytics(tenantId?: string, days: number = 30) {
        const cacheKey = `analytics:revenue:${tenantId || 'all'}:${days}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) return cached;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const matchStage: any = {
            status: 'success',
            createdAt: { $gte: startDate },
        };
        if (tenantId) matchStage.tenant = new Types.ObjectId(tenantId);

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

    async getPopularRoutes(limit: number = 10, tenantId?: string) {
        const cacheKey = `analytics:routes:${tenantId || 'all'}:${limit}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) return cached;

        const matchStage: any = {};
        if (tenantId) matchStage.tenant = new Types.ObjectId(tenantId);

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
}
