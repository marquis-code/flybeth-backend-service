import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getBookingAnalytics(tenantId?: string, days?: number): Promise<{}>;
    getRevenueAnalytics(tenantId?: string, days?: number): Promise<{}>;
    getPopularRoutes(limit?: number, tenantId?: string): Promise<{}>;
}
