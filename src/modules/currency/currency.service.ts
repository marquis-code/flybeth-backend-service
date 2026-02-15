// src/modules/currency/currency.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ExchangeRate, ExchangeRateDocument } from './schemas/exchange-rate.schema';
import { SUPPORTED_CURRENCIES } from '../../common/constants/roles.constant';

@Injectable()
export class CurrencyService {
    private readonly logger = new Logger(CurrencyService.name);
    private readonly CACHE_TTL = 3600000; // 1 hour

    constructor(
        @InjectModel(ExchangeRate.name) private exchangeRateModel: Model<ExchangeRateDocument>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private configService: ConfigService,
    ) { }

    async getExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
        const cacheKey = `exchange:rates:${baseCurrency}`;
        const cached = await this.cacheManager.get<Record<string, number>>(cacheKey);
        if (cached) return cached;

        try {
            const apiKey = this.configService.get<string>('EXCHANGE_RATE_API_KEY');
            const apiUrl = this.configService.get<string>('EXCHANGE_RATE_API_URL');

            const response = await axios.get(
                `${apiUrl}/${apiKey}/latest/${baseCurrency}`,
            );

            if (response.data.result === 'success') {
                const rates = response.data.conversion_rates;

                // Store in DB
                await this.exchangeRateModel.create({
                    baseCurrency,
                    rates,
                    fetchedAt: new Date(),
                });

                // Cache
                await this.cacheManager.set(cacheKey, rates, this.CACHE_TTL);

                this.logger.log(`Exchange rates updated for ${baseCurrency}`);
                return rates;
            }
        } catch (error) {
            this.logger.error(`Failed to fetch exchange rates: ${error.message}`);

            // Fallback to last stored rates
            const lastRate = await this.exchangeRateModel
                .findOne({ baseCurrency })
                .sort({ fetchedAt: -1 })
                .lean()
                .exec();

            if (lastRate) {
                const ratesObject = lastRate.rates;
                await this.cacheManager.set(cacheKey, ratesObject, this.CACHE_TTL);
                return ratesObject;
            }
        }

        // Default fallback rates
        return this.getDefaultRates(baseCurrency);
    }

    async convert(
        amount: number,
        fromCurrency: string,
        toCurrency: string,
    ): Promise<{ convertedAmount: number; exchangeRate: number; fromCurrency: string; toCurrency: string }> {
        if (fromCurrency === toCurrency) {
            return {
                convertedAmount: amount,
                exchangeRate: 1,
                fromCurrency,
                toCurrency,
            };
        }

        const rates = await this.getExchangeRates(fromCurrency);
        const rate = rates[toCurrency];

        if (!rate) {
            this.logger.warn(`Exchange rate not found for ${fromCurrency} → ${toCurrency}`);
            return {
                convertedAmount: amount,
                exchangeRate: 1,
                fromCurrency,
                toCurrency,
            };
        }

        return {
            convertedAmount: Math.round(amount * rate * 100) / 100,
            exchangeRate: rate,
            fromCurrency,
            toCurrency,
        };
    }

    getSupportedCurrencies(): { code: string; name: string; symbol: string }[] {
        const currencyInfo: Record<string, { name: string; symbol: string }> = {
            USD: { name: 'US Dollar', symbol: '$' },
            EUR: { name: 'Euro', symbol: '€' },
            GBP: { name: 'British Pound', symbol: '£' },
            NGN: { name: 'Nigerian Naira', symbol: '₦' },
            GHS: { name: 'Ghanaian Cedi', symbol: 'GH₵' },
            ZAR: { name: 'South African Rand', symbol: 'R' },
            KES: { name: 'Kenyan Shilling', symbol: 'KSh' },
            CAD: { name: 'Canadian Dollar', symbol: 'CA$' },
            AUD: { name: 'Australian Dollar', symbol: 'A$' },
            JPY: { name: 'Japanese Yen', symbol: '¥' },
            CNY: { name: 'Chinese Yuan', symbol: '¥' },
            INR: { name: 'Indian Rupee', symbol: '₹' },
            AED: { name: 'UAE Dirham', symbol: 'د.إ' },
            SAR: { name: 'Saudi Riyal', symbol: '﷼' },
        };

        return SUPPORTED_CURRENCIES.map((code) => ({
            code,
            name: currencyInfo[code]?.name || code,
            symbol: currencyInfo[code]?.symbol || code,
        }));
    }

    private getDefaultRates(baseCurrency: string): Record<string, number> {
        // Fallback rates relative to USD
        const usdRates: Record<string, number> = {
            USD: 1, EUR: 0.92, GBP: 0.79, NGN: 1550, GHS: 15.5,
            ZAR: 18.5, KES: 153, CAD: 1.36, AUD: 1.53,
            JPY: 149.5, CNY: 7.24, INR: 83.1, AED: 3.67, SAR: 3.75,
        };

        if (baseCurrency === 'USD') return usdRates;

        const baseRate = usdRates[baseCurrency] || 1;
        const rates: Record<string, number> = {};
        for (const [code, rate] of Object.entries(usdRates)) {
            rates[code] = Math.round((rate / baseRate) * 10000) / 10000;
        }
        return rates;
    }
}
