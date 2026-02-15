// src/modules/tenants/tenants.controller.ts
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import {
    CreateTenantDto,
    UpdateTenantDto,
    UpdateTenantStatusDto,
} from './dto/create-tenant.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, TenantStatus } from '../../common/constants/roles.constant';
import { MongoIdValidationPipe } from '../../common/pipes/mongo-id-validation.pipe';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
@UseGuards(RolesGuard)
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new tenant (Super Admin only)' })
    create(
        @Body() createTenantDto: CreateTenantDto,
        @CurrentUser('_id') userId: string,
    ) {
        return this.tenantsService.create(createTenantDto, userId);
    }

    @Get()
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'List all tenants with pagination' })
    findAll(
        @Query() paginationDto: PaginationDto,
        @Query('status') status?: TenantStatus,
    ) {
        return this.tenantsService.findAll(paginationDto, status);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get tenant by ID' })
    findOne(@Param('id', MongoIdValidationPipe) id: string) {
        return this.tenantsService.findById(id);
    }

    @Get('slug/:slug')
    @ApiOperation({ summary: 'Get tenant by slug' })
    findBySlug(@Param('slug') slug: string) {
        return this.tenantsService.findBySlug(slug);
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
    @ApiOperation({ summary: 'Update tenant details' })
    update(
        @Param('id', MongoIdValidationPipe) id: string,
        @Body() updateTenantDto: UpdateTenantDto,
    ) {
        return this.tenantsService.update(id, updateTenantDto);
    }

    @Patch(':id/status')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update tenant status (activate/suspend)' })
    updateStatus(
        @Param('id', MongoIdValidationPipe) id: string,
        @Body() updateStatusDto: UpdateTenantStatusDto,
    ) {
        return this.tenantsService.updateStatus(id, updateStatusDto);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete tenant (Super Admin only)' })
    remove(@Param('id', MongoIdValidationPipe) id: string) {
        return this.tenantsService.delete(id);
    }

    @Get(':id/stats')
    @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
    @ApiOperation({ summary: 'Get tenant statistics' })
    getStats(@Param('id', MongoIdValidationPipe) id: string) {
        return this.tenantsService.getStats(id);
    }
}
