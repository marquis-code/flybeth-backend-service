import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SystemConfigService } from './system-config.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';
import { SystemConfig } from './schemas/system-config.schema';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('System Configuration')
@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get public platform settings for user/agent apps' })
  async getPublicConfig() {
    const config = await this.configService.getConfig();
    return {
      platformName: config.platformName,
      ancillaryPrices: config.ancillaryPrices,
      exchangeRates: config.exchangeRates,
    };
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get global system configuration' })
  getConfig() {
    return this.configService.getConfig();
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch()
  @ApiOperation({ summary: 'Update global system configuration' })
  updateConfig(@Body() updateDto: Partial<SystemConfig>) {
    return this.configService.updateConfig(updateDto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post('reset')
  @ApiOperation({ summary: 'Force reset system configuration to global master defaults' })
  async resetConfig() {
    await this.configService.forceReset();
    return this.configService.getConfig();
  }
}
