import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MarketingService } from './marketing.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Marketing')
@ApiBearerAuth()
@Controller('marketing')
@UseGuards(RolesGuard)
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('stats')
  @Roles(Role.AGENT, Role.TENANT_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get campaign statistics' })
  getStats(@CurrentUser('tenant') tenantId: string) {
    return this.marketingService.getStats(tenantId);
  }

  @Public()
  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to newsletter for cheap flights' })
  subscribe(@Body() data: { email: string; source?: string }) {
    if (!data.email) {
      throw new Error('Email is required');
    }
    return this.marketingService.subscribe(data.email, data.source);
  }

  @Get('subscribers')
  @Roles(Role.AGENT, Role.TENANT_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get newsletter subscribers' })
  getSubscribers(@Query('limit') limit?: number) {
    return this.marketingService.getSubscribers(limit ? +limit : 100);
  }

  @Post('campaigns')
  @Roles(Role.AGENT, Role.TENANT_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new marketing campaign' })
  create(
    @CurrentUser('tenant') tenantId: string,
    @CurrentUser('_id') senderId: string,
    @Body() data: any
  ) {
    return this.marketingService.create(tenantId, senderId, data);
  }

  @Get('campaigns')
  @Roles(Role.AGENT, Role.TENANT_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all campaigns for tenant' })
  findAll(@CurrentUser('tenant') tenantId: string) {
    return this.marketingService.findAll(tenantId);
  }

  @Get('templates')
  @Roles(Role.AGENT, Role.TENANT_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get campaign templates' })
  getTemplates(@CurrentUser('tenant') tenantId: string) {
    return this.marketingService.getTemplates(tenantId);
  }

  @Post('templates/seed')
  @Roles(Role.AGENT, Role.TENANT_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Seed default campaign templates' })
  seedTemplates(
    @CurrentUser('tenant') tenantId: string,
    @CurrentUser('_id') senderId: string,
  ) {
    return this.marketingService.seedTemplates(tenantId, senderId);
  }

  @Get('campaigns/:id')
  @Roles(Role.AGENT, Role.TENANT_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get campaign details' })
  findOne(@Param('id') id: string) {
    return this.marketingService.findOne(id);
  }

  @Patch('campaigns/:id')
  @Roles(Role.AGENT, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update campaign' })
  update(
    @Param('id') id: string,
    @CurrentUser('tenant') tenantId: string,
    @Body() data: any
  ) {
    return this.marketingService.update(id, tenantId, data);
  }

  @Delete('campaigns/:id')
  @Roles(Role.AGENT, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Delete campaign' })
  remove(
    @Param('id') id: string,
    @CurrentUser('tenant') tenantId: string
  ) {
    return this.marketingService.remove(id, tenantId);
  }

  @Post('campaigns/:id/send')
  @Roles(Role.AGENT, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Trigger a campaign broadcast' })
  send(@Param('id') id: string) {
    return this.marketingService.sendCampaign(id);
  }
}
