import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  FlightProviderConfig,
  FlightProviderConfigDocument,
} from "./schemas/flight-provider-config.schema";
import { SystemConfigService } from "../system-config/system-config.service";

@Injectable()
export class ProviderConfigService {
  private readonly logger = new Logger(ProviderConfigService.name);

  constructor(
    @InjectModel(FlightProviderConfig.name)
    private configModel: Model<FlightProviderConfigDocument>,
    private systemConfigService: SystemConfigService,
  ) {}

  /**
   * Get or create the singleton config document
   */
  async getConfig(): Promise<FlightProviderConfigDocument> {
    let config = await this.configModel.findOne().exec();
    if (!config) {
      this.logger.log("No provider config found, creating default...");
      config = await this.configModel.create({});
      this.logger.log("Default provider config created");
    }
    return config;
  }

  async getGlobalConfig(): Promise<any> {
    return this.systemConfigService.getConfig();
  }

  /**
   * Update provider configuration
   */
  async updateConfig(
    updateDto: Partial<FlightProviderConfig>,
  ): Promise<FlightProviderConfigDocument> {
    const config = await this.getConfig();
    Object.assign(config, updateDto);
    const saved = await config.save();
    this.logger.log(`Provider config updated`);
    return saved;
  }

  /**
   * Toggle a specific provider on/off
   */
  async toggleProvider(
    providerName: string,
    enabled: boolean,
  ): Promise<FlightProviderConfigDocument> {
    const config = await this.getConfig();
    const provider = config.providers.find((p) => p.name === providerName);
    if (provider) {
      provider.enabled = enabled;
      await config.save();
      this.logger.log(
         `Provider ${providerName} ${enabled ? "enabled" : "disabled"}`,
      );
    }
    return config;
  }

  /**
   * Get names of active providers (optionally filtered by service type)
   */
  async getActiveProviderNames(service?: string): Promise<string[]> {
    const config = await this.getConfig();
    return config.providers
      .filter(
        (p) => p.enabled && (!service || p.supportedServices.includes(service)),
      )
      .sort((a, b) => a.priority - b.priority)
      .map((p) => p.name);
  }

  /**
   * Calculate price with commission based on user segment
   */
  async applySegmentedCommission(
    basePrice: number,
    role: string = 'customer',
  ): Promise<number> {
    const systemConfig = await this.systemConfigService.getConfig();
    const rate = role === 'agent' || role === 'tenant_admin' 
        ? systemConfig.b2bCommission 
        : systemConfig.b2cCommission;
        
    return Math.round(basePrice * (1 + rate / 100) * 100) / 100;
  }

  applyCommission(
    basePrice: number,
    config: FlightProviderConfigDocument,
  ): number {
    if (config.commissionType === "percentage") {
      return (
        Math.round(basePrice * (1 + config.commissionPercentage / 100) * 100) /
        100
      );
    }
    return Math.round((basePrice + config.fixedCommissionAmount) * 100) / 100;
  }
}
