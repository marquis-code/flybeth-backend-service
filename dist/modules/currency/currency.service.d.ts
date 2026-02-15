import { Model } from 'mongoose';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { ExchangeRateDocument } from './schemas/exchange-rate.schema';
export declare class CurrencyService {
    private exchangeRateModel;
    private cacheManager;
    private configService;
    private readonly logger;
    private readonly CACHE_TTL;
    constructor(exchangeRateModel: Model<ExchangeRateDocument>, cacheManager: Cache, configService: ConfigService);
    getExchangeRates(baseCurrency?: string): Promise<Record<string, number>>;
    convert(amount: number, fromCurrency: string, toCurrency: string): Promise<{
        convertedAmount: number;
        exchangeRate: number;
        fromCurrency: string;
        toCurrency: string;
    }>;
    getSupportedCurrencies(): {
        code: string;
        name: string;
        symbol: string;
    }[];
    private getDefaultRates;
}
