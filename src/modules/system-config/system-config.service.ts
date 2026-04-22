import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemConfig, SystemConfigDocument } from './schemas/system-config.schema';

@Injectable()
export class SystemConfigService implements OnModuleInit {
  private readonly logger = new Logger(SystemConfigService.name);
  private cachedConfig: SystemConfigDocument | null = null;

  constructor(
    @InjectModel(SystemConfig.name) private configModel: Model<SystemConfigDocument>,
  ) {}

  async onModuleInit() {
    await this.ensureConfigExists();
  }

  private async ensureConfigExists() {
    this.logger.log('--- Checking Global System Governance Parameters ---');
    let config = await this.configModel.findOne();
    
    const defaultExchangeRates = [
      { currency: 'USD', rate: 1, symbol: '$' },
      { currency: 'NGN', rate: 1550, symbol: '₦' },
      { currency: 'GBP', rate: 0.78, symbol: '£' },
      { currency: 'EUR', rate: 0.91, symbol: '€' },
      { currency: 'CAD', rate: 1.36, symbol: 'C$' },
      { currency: 'AUD', rate: 1.51, symbol: 'A$' },
      { currency: 'ZAR', rate: 18.50, symbol: 'R' },
      { currency: 'KES', rate: 130, symbol: 'KSh' },
      { currency: 'GHS', rate: 14.50, symbol: 'GH₵' },
      { currency: 'AED', rate: 3.67, symbol: 'د.إ' },
      { currency: 'CNY', rate: 7.24, symbol: '¥' },
      { currency: 'JPY', rate: 155, symbol: '¥' },
      { currency: 'INR', rate: 83.50, symbol: '₹' }
    ];

    const defaultAncillaryPrices = { bags: 25, seats: 15, insurance: 12 };

    if (!config) {
      this.logger.warn('No platform config found. Creating from blueprint...');
      config = new this.configModel({
        b2bCommission: 5,
        b2cCommission: 10,
        whitelistedStates: ['Hawaii', 'California', 'Florida'],
        isWhitelistingEnabled: true,
        ancillaryMargin: 15,
        exchangeRates: defaultExchangeRates,
        ancillaryPrices: defaultAncillaryPrices,
        platformName: 'Flybeth Global'
      });
      await config.save();
      this.logger.log('Platform blueprint successfully deployed.');
    } else {
      this.logger.log('Platform config audit in progress...');
      let needsUpdate = false;
      
      // Force populate if empty or fundamentally incomplete
      if (!config.exchangeRates || config.exchangeRates.length === 0) {
        this.logger.warn('Empty Exchange Library detected. Aggressively seeding defaults...');
        config.exchangeRates = defaultExchangeRates;
        needsUpdate = true;
      }
      
      if (!config.ancillaryPrices || !config.ancillaryPrices.bags || !config.ancillaryPrices.seats || !config.ancillaryPrices.insurance) {
        this.logger.warn('Broken or incomplete Ancillary Pricing detected. Restoring default values...');
        config.ancillaryPrices = {
          bags: config.ancillaryPrices?.bags || defaultAncillaryPrices.bags,
          seats: config.ancillaryPrices?.seats || defaultAncillaryPrices.seats,
          insurance: config.ancillaryPrices?.insurance || defaultAncillaryPrices.insurance,
        };
        needsUpdate = true;
      }

      if (config.ancillaryMargin === undefined) {
        config.ancillaryMargin = 15;
        needsUpdate = true;
      }

      if (config.platformName === undefined) {
        config.platformName = 'Flybeth Global';
        needsUpdate = true;
      }

      if (needsUpdate) {
        await config.save();
        this.logger.log('Platform configuration audit complete: Defaults restored and persisted.');
      } else {
        this.logger.log('Platform configuration audit complete: All parameters are healthy.');
      }
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
    
    // Fail-safe: If for some reason the config is empty in cache, trigger a re-seed check
    if (!this.cachedConfig || !this.cachedConfig.exchangeRates || this.cachedConfig.exchangeRates.length === 0) {
      this.logger.warn('Fail-safe triggered: Config cache is fundamentally incomplete. Re-auditing DB...');
      await this.ensureConfigExists();
    }
    
    return this.cachedConfig!;
  }

  async forceReset() {
    this.logger.warn('NUCLEAR RESET INITIATED: Purging all platform configuration documents...');
    await this.configModel.deleteMany({});
    this.cachedConfig = null;
    await this.ensureConfigExists();
  }

  async updateConfig(updateDto: Partial<SystemConfig>) {
    // Ensure we only ever have ONE config document
    const config = await this.configModel.findOneAndUpdate({}, updateDto, { 
      new: true, 
      upsert: true,
      setDefaultsOnInsert: true 
    });
    await this.refreshCache();
    return config;
  }

  async isStateWhitelisted(state: string): Promise<boolean> {
    const config = await this.getConfig();
    if (!config.isWhitelistingEnabled) return true;
    return config.whitelistedStates.includes(state);
  }
}
