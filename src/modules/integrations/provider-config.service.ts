import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  FlightProviderConfig,
  FlightProviderConfigDocument,
} from "./schemas/flight-provider-config.schema";
import { SystemConfigService } from "../system-config/system-config.service";
import { isNigerianOrigin } from "./constants/nigeria-origins.constant";

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
    const count = await this.configModel.estimatedDocumentCount();
    const config = await this.configModel
      .findOne()
      .sort({ updatedAt: -1 })
      .exec();

    if (!config) {
      this.logger.log("No provider config found, creating default...");
      const created = await this.configModel.create({});
      this.logger.log("Default provider config created");
      return created;
    }

    if (count > 1) {
      this.logger.warn(
        `Found ${count} provider config documents; using the most recently updated one.`,
      );
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
   * Calculate price with commission based on user segment and flight context (domestic vs international)
   */
  async applySegmentedCommission(
    basePrice: number,
    role: string = 'customer',
    flightContext?: { origin?: string; destination?: string; isDomestic?: boolean },
  ): Promise<number> {
    const systemConfig = await this.systemConfigService.getConfig();

    if (flightContext && (systemConfig as any).flightFees) {
      const isDomestic = flightContext.isDomestic !== undefined
        ? flightContext.isDomestic
        : (isNigerianOrigin(flightContext.origin) && isNigerianOrigin(flightContext.destination));

      const feeRules = isDomestic
        ? (systemConfig as any).flightFees.domestic
        : (systemConfig as any).flightFees.international;

      if (feeRules) {
        let price = basePrice;

        // Apply general margin first if configured
        if (feeRules.marginValue > 0) {
          if (feeRules.marginType === 'fixed') {
            price += feeRules.marginValue;
          } else {
            price = price * (1 + feeRules.marginValue / 100);
          }
        }

        // Apply role fee (B2B vs B2C)
        const isB2b = role === 'agent' || role === 'tenant_admin';
        const feeType = isB2b ? feeRules.b2bType : feeRules.b2cType;
        const feeValue = isB2b ? feeRules.b2bValue : feeRules.b2cValue;

        if (feeValue > 0) {
          if (feeType === 'fixed') {
            price += feeValue;
          } else {
            price = price * (1 + feeValue / 100);
          }
        }

        return Math.round(price * 100) / 100;
      }
    }

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
