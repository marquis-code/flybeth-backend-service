// src/modules/integrations/provider-config.controller.ts
import { Controller, Get, Patch, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProviderConfigService } from "./provider-config.service";
import {
  UpdateProviderConfigDto,
  ToggleProviderDto,
} from "./dto/provider-config.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Public } from "../../common/decorators/public.decorator";
import { Role } from "../../common/constants/roles.constant";

@ApiTags("Integrations")
@Controller("integrations/providers")
export class ProviderConfigController {
  constructor(private readonly providerConfigService: ProviderConfigService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Get provider configuration (public)" })
  async getConfig() {
    const config = await this.providerConfigService.getConfig();
    return {
      providers: config.providers.map((p) => ({
        name: p.name,
        displayName: p.displayName,
        enabled: p.enabled,
        supportedServices: p.supportedServices,
      })),
      commissionPercentage: config.commissionPercentage,
      commissionType: config.commissionType,
    };
  }

  @Patch()
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: "Update provider configuration (Admin only)" })
  async updateConfig(@Body() updateDto: UpdateProviderConfigDto) {
    return this.providerConfigService.updateConfig(updateDto as any);
  }

  @Patch("toggle")
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: "Toggle a provider on/off (Admin only)" })
  async toggleProvider(@Body() toggleDto: ToggleProviderDto) {
    return this.providerConfigService.toggleProvider(
      toggleDto.providerName,
      toggleDto.enabled,
    );
  }

  @Public()
  @Get("active")
  @ApiOperation({ summary: "Get currently active providers" })
  async getActiveProviders() {
    const [flightProviders, staysProviders] = await Promise.all([
      this.providerConfigService.getActiveProviderNames("flights"),
      this.providerConfigService.getActiveProviderNames("stays"),
    ]);
    return {
      flights: flightProviders,
      stays: staysProviders,
    };
  }
}
