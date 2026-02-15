"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CurrencyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const cache_manager_1 = require("@nestjs/cache-manager");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const exchange_rate_schema_1 = require("./schemas/exchange-rate.schema");
const roles_constant_1 = require("../../common/constants/roles.constant");
let CurrencyService = CurrencyService_1 = class CurrencyService {
    constructor(exchangeRateModel, cacheManager, configService) {
        this.exchangeRateModel = exchangeRateModel;
        this.cacheManager = cacheManager;
        this.configService = configService;
        this.logger = new common_1.Logger(CurrencyService_1.name);
        this.CACHE_TTL = 3600000;
    }
    async getExchangeRates(baseCurrency = 'USD') {
        const cacheKey = `exchange:rates:${baseCurrency}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached)
            return cached;
        try {
            const apiKey = this.configService.get('EXCHANGE_RATE_API_KEY');
            const apiUrl = this.configService.get('EXCHANGE_RATE_API_URL');
            const response = await axios_1.default.get(`${apiUrl}/${apiKey}/latest/${baseCurrency}`);
            if (response.data.result === 'success') {
                const rates = response.data.conversion_rates;
                await this.exchangeRateModel.create({
                    baseCurrency,
                    rates,
                    fetchedAt: new Date(),
                });
                await this.cacheManager.set(cacheKey, rates, this.CACHE_TTL);
                this.logger.log(`Exchange rates updated for ${baseCurrency}`);
                return rates;
            }
        }
        catch (error) {
            this.logger.error(`Failed to fetch exchange rates: ${error.message}`);
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
        return this.getDefaultRates(baseCurrency);
    }
    async convert(amount, fromCurrency, toCurrency) {
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
    getSupportedCurrencies() {
        const currencyInfo = {
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
        return roles_constant_1.SUPPORTED_CURRENCIES.map((code) => ({
            code,
            name: currencyInfo[code]?.name || code,
            symbol: currencyInfo[code]?.symbol || code,
        }));
    }
    getDefaultRates(baseCurrency) {
        const usdRates = {
            USD: 1, EUR: 0.92, GBP: 0.79, NGN: 1550, GHS: 15.5,
            ZAR: 18.5, KES: 153, CAD: 1.36, AUD: 1.53,
            JPY: 149.5, CNY: 7.24, INR: 83.1, AED: 3.67, SAR: 3.75,
        };
        if (baseCurrency === 'USD')
            return usdRates;
        const baseRate = usdRates[baseCurrency] || 1;
        const rates = {};
        for (const [code, rate] of Object.entries(usdRates)) {
            rates[code] = Math.round((rate / baseRate) * 10000) / 10000;
        }
        return rates;
    }
};
exports.CurrencyService = CurrencyService;
exports.CurrencyService = CurrencyService = CurrencyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(exchange_rate_schema_1.ExchangeRate.name)),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [mongoose_2.Model, Object, config_1.ConfigService])
], CurrencyService);
//# sourceMappingURL=currency.service.js.map