import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query, Headers, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Support')
@Controller('support')
@UseGuards(RolesGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Public()
  @Post('newsletter/subscribe')
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  async subscribe(
    @Body('email') email: string, 
    @Body('source') source: string,
    @Headers('x-tenant-id') tenantId: string
  ) {
    // If tenantId is not in header, we could try to find a default or fail
    // For this implementation, we require the tenantId in the header or body
    return this.supportService.subscribeNewsletter(tenantId, email, source);
  }

  @Public()
  @Post('contact/submit')
  @ApiOperation({ summary: 'Submit a contact inquiry' })
  async submitInquiry(
    @Body() data: any,
    @Headers('x-tenant-id') tenantId: string
  ) {
    return this.supportService.submitInquiry(tenantId, data);
  }

  @ApiBearerAuth()
  @Get('newsletter')
  @Roles(Role.TENANT_ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'List newsletter subscriptions' })
  findAllSubscriptions(@CurrentUser('tenant') tenantId: string, @Query() query: any) {
    return this.supportService.getSubscriptions(tenantId, query);
  }

  @ApiBearerAuth()
  @Get('contact')
  @Roles(Role.TENANT_ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'List contact inquiries' })
  findAllInquiries(@CurrentUser('tenant') tenantId: string, @Query() query: any) {
    return this.supportService.getInquiries(tenantId, query);
  }

  @ApiBearerAuth()
  @Patch('contact/:id/status')
  @Roles(Role.TENANT_ADMIN, Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Update inquiry status' })
  updateInquiryStatus(
    @Param('id') id: string,
    @CurrentUser('tenant') tenantId: string,
    @Body('status') status: string
  ) {
    return this.supportService.updateInquiry(id, tenantId, status);
  }
}
