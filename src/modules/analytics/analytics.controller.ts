// src/modules/analytics/analytics.controller.ts
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Role } from "../../common/constants/roles.constant";

@ApiTags("Analytics")
@ApiBearerAuth()
@Controller("analytics")
@UseGuards(RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.AGENT)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Tenants and agents may only ever see their own data, regardless of what
   * `tenantId` they pass. Platform admins keep the ability to query anything.
   *
   * Returns `undefined` for super admins (meaning "no tenant filter") and the
   * caller's own tenant id otherwise. `null` means the caller has no tenant and
   * must therefore see nothing.
   */
  private scopeTenant(user: any, requestedTenantId?: string): string | null | undefined {
    const roleName =
      typeof user?.role === "object" ? user?.role?.name : user?.role;

    if (roleName === Role.SUPER_ADMIN || !roleName) {
      return requestedTenantId;
    }

    const own = user?.tenant?._id || user?.tenant;
    return own ? String(own) : null;
  }

  @Get("bookings")
  @ApiOperation({ summary: "Get booking analytics" })
  getBookingAnalytics(
    @CurrentUser() user: any,
    @Query("tenantId") tenantId?: string,
    @Query("days") days?: number,
  ) {
    const scope = this.scopeTenant(user, tenantId);
    if (scope === null) return { trends: [], total: 0 };
    return this.analyticsService.getBookingAnalytics(scope, days);
  }

  @Get("revenue")
  @ApiOperation({ summary: "Get revenue analytics" })
  getRevenueAnalytics(
    @CurrentUser() user: any,
    @Query("tenantId") tenantId?: string,
    @Query("days") days?: number,
  ) {
    const scope = this.scopeTenant(user, tenantId);
    if (scope === null) return { trends: [], total: 0 };
    return this.analyticsService.getRevenueAnalytics(scope, days);
  }

  @Get("popular-routes")
  @ApiOperation({ summary: "Get popular flight routes" })
  getPopularRoutes(
    @CurrentUser() user: any,
    @Query("limit") limit?: number,
    @Query("tenantId") tenantId?: string,
  ) {
    const scope = this.scopeTenant(user, tenantId);
    if (scope === null) return [];
    return this.analyticsService.getPopularRoutes(limit, scope);
  }

  @Get("agent")
  @Roles(Role.AGENT, Role.TENANT_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get high-level agent dashboard stats" })
  getAgentStats(@CurrentUser() user: any, @Query("tenantId") tenantId?: string) {
    const scope = this.scopeTenant(user, tenantId);
    if (scope === null) {
      return {
        activeBookings: 0,
        totalBookings: 0,
        totalRevenue: 0,
        pendingBookings: 0,
      };
    }
    if (!scope) {
      // Super admin without an explicit tenant: nothing to aggregate.
      return {
        activeBookings: 0,
        totalBookings: 0,
        totalRevenue: 0,
        pendingBookings: 0,
      };
    }
    return this.analyticsService.getAgentStats(scope);
  }
}
