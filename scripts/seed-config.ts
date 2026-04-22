import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SystemConfigService } from '../src/modules/system-config/system-config.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(SystemConfigService);

  console.log('--- AGGRESSIVE SEEDING INITIATED ---');

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

  const defaultAncillaryPrices = { bags: 25, seats: 15 };

  try {
    const currentConfig = await configService.getConfig();
    console.log('Current config found. Updating with defaults...');
    
    await configService.updateConfig({
      exchangeRates: defaultExchangeRates,
      ancillaryPrices: defaultAncillaryPrices,
      ancillaryMargin: 15,
      platformName: 'Flybeth Global'
    });

    console.log('SUCCESS: System configuration seeded successfully.');
    console.log('Exchange Rates:', defaultExchangeRates.length, 'currencies added.');
    console.log('Ancillary Prices:', defaultAncillaryPrices);
  } catch (error) {
    console.error('FAILURE: Seeding failed.', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();
