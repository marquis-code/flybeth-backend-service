import { Model } from 'mongoose';
import { Cache } from 'cache-manager';
import { Booking } from '../bookings/schemas/booking.schema';
import { Payment } from '../payments/schemas/payment.schema';
export declare class AnalyticsService {
    private bookingModel;
    private paymentModel;
    private cacheManager;
    private readonly logger;
    constructor(bookingModel: Model<Booking>, paymentModel: Model<Payment>, cacheManager: Cache);
    getBookingAnalytics(tenantId?: string, days?: number): Promise<{}>;
    getRevenueAnalytics(tenantId?: string, days?: number): Promise<{}>;
    getPopularRoutes(limit?: number, tenantId?: string): Promise<{}>;
}
