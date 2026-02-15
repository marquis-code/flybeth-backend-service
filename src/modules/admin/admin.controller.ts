// src/modules/admin/admin.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/constants/roles.constant';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get admin dashboard overview' })
    getDashboard() {
        return this.adminService.getDashboard();
    }

    @Get('revenue')
    @ApiOperation({ summary: 'Get revenue reports' })
    getRevenue(
        @Query('period') period?: string,
        @Query('tenantId') tenantId?: string,
    ) {
        return this.adminService.getRevenue(period, tenantId);
    }

    @Get('tenants')
    @ApiOperation({ summary: 'List all tenants' })
    getTenants(@Query() paginationDto: PaginationDto) {
        return this.adminService.getTenants(paginationDto);
    }

    @Get('users')
    @ApiOperation({ summary: 'List all users' })
    getUsers(@Query() paginationDto: PaginationDto) {
        return this.adminService.getUsers(paginationDto);
    }

    @Get('bookings')
    @ApiOperation({ summary: 'List all bookings' })
    getBookings(@Query() paginationDto: PaginationDto) {
        return this.adminService.getBookings(paginationDto);
    }

    @Get('system-health')
    @ApiOperation({ summary: 'Get system health status' })
    getSystemHealth() {
        return this.adminService.getSystemHealth();
    }
}
