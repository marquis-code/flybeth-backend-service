// src/modules/analytics/analytics.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/constants/roles.constant';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('bookings')
    @ApiOperation({ summary: 'Get booking analytics' })
    getBookingAnalytics(
        @Query('tenantId') tenantId?: string,
        @Query('days') days?: number,
    ) {
        return this.analyticsService.getBookingAnalytics(tenantId, days);
    }

    @Get('revenue')
    @ApiOperation({ summary: 'Get revenue analytics' })
    getRevenueAnalytics(
        @Query('tenantId') tenantId?: string,
        @Query('days') days?: number,
    ) {
        return this.analyticsService.getRevenueAnalytics(tenantId, days);
    }

    @Get('popular-routes')
    @ApiOperation({ summary: 'Get popular flight routes' })
    getPopularRoutes(
        @Query('limit') limit?: number,
        @Query('tenantId') tenantId?: string,
    ) {
        return this.analyticsService.getPopularRoutes(limit, tenantId);
    }
}
