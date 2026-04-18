import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ItinerariesService } from './itineraries.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Itineraries')
@ApiBearerAuth()
@Controller('itineraries')
@UseGuards(RolesGuard)
export class ItinerariesController {
  constructor(private readonly itinerariesService: ItinerariesService) {}

  @Post()
  @Roles(Role.AGENT, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Create a new trip itinerary' })
  create(
    @CurrentUser('tenant') tenantId: string,
    @CurrentUser('_id') agentId: string,
    @Body() data: any
  ) {
    return this.itinerariesService.create(tenantId, agentId, data);
  }

  @Get()
  @Roles(Role.AGENT, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'List all itineraries for agent' })
  findAll(@CurrentUser('tenant') tenantId: string) {
    return this.itinerariesService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get itinerary by ID' })
  findOne(@Param('id') id: string) {
    return this.itinerariesService.findOne(id);
  }

  @Post(':id') // Changed from Patch because sometimes nest routing gets weird with Patch
  @Roles(Role.AGENT, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update itinerary by ID' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.itinerariesService.update(id, data);
  }
}
