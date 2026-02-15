import { CurrencyService } from './currency.service';
export declare class CurrencyController {
    private readonly currencyService;
    constructor(currencyService: CurrencyService);
    getRates(base?: string): Promise<Record<string, number>>;
    convert(amount: string, from: string, to: string): Promise<{
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
}
