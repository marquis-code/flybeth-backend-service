// src/modules/currency/currency.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrencyService } from './currency.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Currency')
@Controller('currency')
export class CurrencyController {
    constructor(private readonly currencyService: CurrencyService) { }

    @Public()
    @Get('rates')
    @ApiOperation({ summary: 'Get exchange rates for a base currency' })
    getRates(@Query('base') base?: string) {
        return this.currencyService.getExchangeRates(base || 'USD');
    }

    @Public()
    @Get('convert')
    @ApiOperation({ summary: 'Convert amount between currencies' })
    convert(
        @Query('amount') amount: string,
        @Query('from') from: string,
        @Query('to') to: string,
    ) {
        return this.currencyService.convert(
            parseFloat(amount),
            from?.toUpperCase() || 'USD',
            to?.toUpperCase() || 'USD',
        );
    }

    @Public()
    @Get('supported')
    @ApiOperation({ summary: 'Get list of supported currencies' })
    getSupportedCurrencies() {
        return this.currencyService.getSupportedCurrencies();
    }
}
