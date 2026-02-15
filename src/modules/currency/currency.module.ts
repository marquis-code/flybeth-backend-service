// src/modules/currency/currency.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { ExchangeRate, ExchangeRateSchema } from './schemas/exchange-rate.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: ExchangeRate.name, schema: ExchangeRateSchema }]),
    ],
    controllers: [CurrencyController],
    providers: [CurrencyService],
    exports: [CurrencyService],
})
export class CurrencyModule { }
