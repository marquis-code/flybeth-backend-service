// src/modules/currency/currency.service.ts
import { Injectable, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { Currency, CurrencyDocument } from "./schemas/currency.schema";

@Injectable()
export class CurrencyService implements OnModuleInit {
  private readonly logger = new Logger(CurrencyService.name);
  private readonly CACHE_TTL = 3600000; // 1 hour

  constructor(
    @InjectModel(Currency.name)
    private currencyModel: Model<CurrencyDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async onModuleInit() {
    // Seed initial currencies if DB is empty
    const count = await this.currencyModel.countDocuments();
    if (count === 0) {
      await this.seedCurrencies();
    }
  }

  async getExchangeRates(baseCurrency: string = "USD"): Promise<Record<string, number>> {
    const cacheKey = `internal:exchange:rates:${baseCurrency}`;
    const cached = await this.cacheManager.get<Record<string, number>>(cacheKey);
    if (cached) return cached;

    const currencies = await this.currencyModel.find({ isActive: true }).exec();
    const base = currencies.find((c) => c.code === baseCurrency);
    const baseRateToBase = base ? base.rateToBase : 1;

    const rates: Record<string, number> = {};
    currencies.forEach((c) => {
      // Internal Rate Calculation with Margin (Revenue Generation)
      const marketRate = c.rateToBase / baseRateToBase;
      const marginMultiplier = 1 + (c.marginPercentage / 100);
      rates[c.code] = parseFloat((marketRate * marginMultiplier).toFixed(4));
    });

    await this.cacheManager.set(cacheKey, rates, this.CACHE_TTL);
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
    return this.currencyModel.find({ isActive: true }).sort({ code: 1 }).exec();
  }

  // Admin Methods
  async getAllCurrencies() {
    return this.currencyModel.find().sort({ code: 1 }).exec();
  }

  async updateCurrency(code: string, update: any) {
    const currency = await this.currencyModel.findOneAndUpdate({ code }, { $set: update }, { new: true }).exec();
    await this.cacheManager.reset(); // Aggressively clear cache on update
    return currency;
  }

  async createCurrency(data: any) {
    const currency = await this.currencyModel.create(data);
    await this.cacheManager.reset();
    return currency;
  }

  private async seedCurrencies() {
    const initial = [
      { code: "USD", name: "US Dollar", symbol: "$", rateToBase: 1, marginPercentage: 0 },
      { code: "EUR", name: "Euro", symbol: "€", rateToBase: 0.92, marginPercentage: 2 },
      { code: "GBP", name: "British Pound", symbol: "£", rateToBase: 0.79, marginPercentage: 2 },
      { code: "NGN", name: "Nigerian Naira", symbol: "₦", rateToBase: 1550, marginPercentage: 5 },
      { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", rateToBase: 15.5, marginPercentage: 5 },
      { code: "KES", name: "Kenyan Shilling", symbol: "KSh", rateToBase: 153, marginPercentage: 5 },
      { code: "ZAR", name: "South African Rand", symbol: "R", rateToBase: 18.5, marginPercentage: 5 },
    ];
    await this.currencyModel.insertMany(initial);
    this.logger.log("Seeded initial currencies for internal management");
  }
}
