import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SystemConfigService } from './system-config.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';
import { SystemConfig } from './schemas/system-config.schema';

@ApiTags('System Configuration')
@ApiBearerAuth()
@Controller('system-config')
@UseGuards(RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get global system configuration' })
  getConfig() {
    return this.configService.getConfig();
  }

  @Patch()
  @ApiOperation({ summary: 'Update global system configuration' })
  updateConfig(@Body() updateDto: Partial<SystemConfig>) {
    return this.configService.updateConfig(updateDto);
  }
}
