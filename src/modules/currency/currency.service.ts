import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { SystemConfigService } from "../system-config/system-config.service";

@Injectable()
export class CurrencyService implements OnModuleInit {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(
    private readonly systemConfigService: SystemConfigService,
  ) {}

  async onModuleInit() {
    // Seeding logic is now handled in SystemConfigService
  }

  async getExchangeRates(baseCurrency: string = "USD"): Promise<Record<string, number>> {
    const config = await this.systemConfigService.getConfig();
    const currencies = config.exchangeRates || [];
    
    const base = currencies.find((c) => c.currency === baseCurrency);
    const baseRateToBase = base ? base.rate : 1;

    const rates: Record<string, number> = {};
    currencies.forEach((c) => {
      // Internal Rate Calculation
      const marketRate = c.rate / baseRateToBase;
      // You can add additional global markup here if needed, 
      // but usually the admin sets the 'final' rate in the dashboard
      rates[c.currency] = parseFloat(marketRate.toFixed(4));
    });

    return rates;
  }

  async convert(amount: number, fromCurrency: string, toCurrency: string): Promise<any> {
    if (fromCurrency === toCurrency) {
      return { convertedAmount: amount, exchangeRate: 1, fromCurrency, toCurrency };
    }

    const rates = await this.getExchangeRates(fromCurrency);
    const rate = rates[toCurrency];

    if (!rate) {
      this.logger.warn(`Exchange rate not found for ${fromCurrency} → ${toCurrency}`);
      return { convertedAmount: amount, exchangeRate: 1, fromCurrency, toCurrency };
    }

    return {
      convertedAmount: Math.round(amount * rate * 100) / 100,
      exchangeRate: rate,
      fromCurrency,
      toCurrency,
    };
  }

  async getSupportedCurrencies() {
    const config = await this.systemConfigService.getConfig();
    // Map back to the legacy structure to avoid breaking existing clients if they expect certain fields
    return (config.exchangeRates || []).map(c => ({
      code: c.currency,
      currency: c.currency,
      rate: c.rate,
      symbol: c.symbol,
      isActive: true,
      name: this.getCurrencyName(c.currency)
    }));
  }

  private getCurrencyName(code: string): string {
    const names: Record<string, string> = {
      'USD': 'US Dollar', 'EUR': 'Euro', 'GBP': 'British Pound', 'NGN': 'Nigerian Naira',
      'CAD': 'Canadian Dollar', 'AUD': 'Australian Dollar', 'JPY': 'Japanese Yen',
      'CNY': 'Chinese Yuan', 'INR': 'Indian Rupee', 'ZAR': 'South African Rand',
      'KES': 'Kenyan Shilling', 'GHS': 'Ghanaian Cedi', 'AED': 'UAE Dirham',
      'BRL': 'Brazilian Real', 'MXN': 'Mexican Peso', 'CHF': 'Swiss Franc',
      'SEK': 'Swedish Krona', 'NOK': 'Norwegian Krone', 'DKK': 'Danish Krone',
      'PLN': 'Polish Zloty', 'SGD': 'Singapore Dollar', 'HKD': 'Hong Kong Dollar',
      'THB': 'Thai Baht', 'MYR': 'Malaysian Ringgit', 'PHP': 'Philippine Peso',
      'KRW': 'South Korean Won', 'TWD': 'Taiwan Dollar', 'TRY': 'Turkish Lira',
      'EGP': 'Egyptian Pound', 'SAR': 'Saudi Riyal', 'QAR': 'Qatari Riyal',
      'KWD': 'Kuwaiti Dinar', 'BHD': 'Bahraini Dinar', 'OMR': 'Omani Rial',
      'JOD': 'Jordanian Dinar', 'COP': 'Colombian Peso', 'ARS': 'Argentine Peso',
      'CLP': 'Chilean Peso', 'PEN': 'Peruvian Sol', 'RUB': 'Russian Ruble',
      'UAH': 'Ukrainian Hryvnia', 'CZK': 'Czech Koruna', 'HUF': 'Hungarian Forint',
      'RON': 'Romanian Leu', 'BGN': 'Bulgarian Lev', 'HRK': 'Croatian Kuna',
      'ISK': 'Icelandic Krona', 'NZD': 'New Zealand Dollar', 'FJD': 'Fijian Dollar',
      'XOF': 'West African CFA', 'XAF': 'Central African CFA', 'MAD': 'Moroccan Dirham',
      'TND': 'Tunisian Dinar', 'DZD': 'Algerian Dinar', 'LYD': 'Libyan Dinar',
      'TZS': 'Tanzanian Shilling', 'UGX': 'Ugandan Shilling', 'RWF': 'Rwandan Franc',
      'ETB': 'Ethiopian Birr', 'BWP': 'Botswana Pula', 'MUR': 'Mauritian Rupee',
      'SCR': 'Seychellois Rupee',
    };
    return names[code] || code;
  }


  // Admin Methods (now mostly proxied or deprecated in favor of SystemConfig)
  async getAllCurrencies() {
    return this.getSupportedCurrencies();
  }

  async updateCurrency(code: string, update: any) {
    const config = await this.systemConfigService.getConfig();
    const rates = [...config.exchangeRates];
    const index = rates.findIndex(r => r.currency === code);
    if (index !== -1) {
      rates[index] = { ...rates[index], ...update };
      return this.systemConfigService.updateConfig({ exchangeRates: rates });
    }
    return config;
  }

  async createCurrency(data: any) {
    const config = await this.systemConfigService.getConfig();
    const rates = [...config.exchangeRates, data];
    return this.systemConfigService.updateConfig({ exchangeRates: rates });
  }
}
