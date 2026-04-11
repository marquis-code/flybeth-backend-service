import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemConfig, SystemConfigDocument } from './schemas/system-config.schema';

@Injectable()
export class SystemConfigService implements OnModuleInit {
  private cachedConfig: SystemConfigDocument | null = null;

  constructor(
    @InjectModel(SystemConfig.name) private configModel: Model<SystemConfigDocument>,
  ) {}

  async onModuleInit() {
    await this.ensureConfigExists();
  }

  private async ensureConfigExists() {
    const config = await this.configModel.findOne();
    if (!config) {
      const newConfig = new this.configModel({
        b2bCommission: 5,
        b2cCommission: 10,
        whitelistedStates: ['Hawaii', 'California', 'Florida'],
        isWhitelistingEnabled: true,
      });
      await newConfig.save();
    }
    await this.refreshCache();
  }

  async refreshCache() {
    this.cachedConfig = await this.configModel.findOne();
    return this.cachedConfig;
  }

  async getConfig(): Promise<SystemConfigDocument> {
    if (!this.cachedConfig) {
      await this.refreshCache();
    }
    return this.cachedConfig!;
  }

  async updateConfig(updateDto: Partial<SystemConfig>) {
    const config = await this.configModel.findOneAndUpdate({}, updateDto, { new: true, upsert: true });
    await this.refreshCache();
    return config;
  }

  async isStateWhitelisted(state: string): Promise<boolean> {
    const config = await this.getConfig();
    if (!config.isWhitelistingEnabled) return true;
    return config.whitelistedStates.includes(state);
  }
}
