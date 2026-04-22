const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://flybeth:flybeth@flybeth.mqyheku.mongodb.net/?appName=flybeth';

const SystemConfigSchema = new mongoose.Schema({
  b2bCommission: Number,
  b2cCommission: Number,
  whitelistedStates: [String],
  isWhitelistingEnabled: Boolean,
  platformName: String,
  ancillaryMargin: Number,
  exchangeRates: [{ currency: String, rate: Number, symbol: String }],
  ancillaryPrices: mongoose.Schema.Types.Mixed
}, { timestamps: true, collection: 'systemconfigs' });

const SystemConfig = mongoose.model('SystemConfig', SystemConfigSchema);

async function seed() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // Purge old data
    await SystemConfig.deleteMany({});
    console.log('Purged old configs.');

    const exchangeRates = [
      { currency: 'USD', rate: 1, symbol: '$' },
      { currency: 'EUR', rate: 0.91, symbol: '€' },
      { currency: 'GBP', rate: 0.78, symbol: '£' },
      { currency: 'NGN', rate: 1550, symbol: '₦' },
      { currency: 'CAD', rate: 1.36, symbol: 'C$' },
      { currency: 'AUD', rate: 1.51, symbol: 'A$' },
      { currency: 'JPY', rate: 155, symbol: '¥' },
      { currency: 'CNY', rate: 7.24, symbol: '¥' },
      { currency: 'INR', rate: 83.50, symbol: '₹' },
      { currency: 'ZAR', rate: 18.50, symbol: 'R' },
      { currency: 'KES', rate: 130, symbol: 'KSh' },
      { currency: 'GHS', rate: 14.50, symbol: 'GH₵' },
      { currency: 'AED', rate: 3.67, symbol: 'د.إ' },
      { currency: 'BRL', rate: 5.05, symbol: 'R$' },
      { currency: 'MXN', rate: 17.15, symbol: 'MX$' },
      { currency: 'CHF', rate: 0.88, symbol: 'CHF' },
      { currency: 'SEK', rate: 10.45, symbol: 'kr' },
      { currency: 'NOK', rate: 10.60, symbol: 'kr' },
      { currency: 'DKK', rate: 6.80, symbol: 'kr' },
      { currency: 'PLN', rate: 3.98, symbol: 'zł' },
      { currency: 'SGD', rate: 1.34, symbol: 'S$' },
      { currency: 'HKD', rate: 7.82, symbol: 'HK$' },
      { currency: 'THB', rate: 34.50, symbol: '฿' },
      { currency: 'MYR', rate: 4.47, symbol: 'RM' },
      { currency: 'PHP', rate: 56.20, symbol: '₱' },
      { currency: 'KRW', rate: 1320, symbol: '₩' },
      { currency: 'TWD', rate: 31.50, symbol: 'NT$' },
      { currency: 'TRY', rate: 32.10, symbol: '₺' },
      { currency: 'EGP', rate: 48.50, symbol: 'E£' },
      { currency: 'SAR', rate: 3.75, symbol: '﷼' },
      { currency: 'QAR', rate: 3.64, symbol: 'QR' },
      { currency: 'KWD', rate: 0.31, symbol: 'KD' },
      { currency: 'BHD', rate: 0.38, symbol: 'BD' },
      { currency: 'OMR', rate: 0.38, symbol: 'OMR' },
      { currency: 'JOD', rate: 0.71, symbol: 'JD' },
      { currency: 'COP', rate: 3950, symbol: 'COL$' },
      { currency: 'ARS', rate: 870, symbol: 'AR$' },
      { currency: 'CLP', rate: 925, symbol: 'CL$' },
      { currency: 'PEN', rate: 3.72, symbol: 'S/.' },
      { currency: 'RUB', rate: 92, symbol: '₽' },
      { currency: 'UAH', rate: 41, symbol: '₴' },
      { currency: 'CZK', rate: 22.50, symbol: 'Kč' },
      { currency: 'HUF', rate: 355, symbol: 'Ft' },
      { currency: 'RON', rate: 4.55, symbol: 'lei' },
      { currency: 'BGN', rate: 1.78, symbol: 'лв' },
      { currency: 'HRK', rate: 6.85, symbol: 'kn' },
      { currency: 'ISK', rate: 137, symbol: 'kr' },
      { currency: 'NZD', rate: 1.63, symbol: 'NZ$' },
      { currency: 'FJD', rate: 2.24, symbol: 'FJ$' },
      { currency: 'XOF', rate: 597, symbol: 'CFA' },
      { currency: 'XAF', rate: 597, symbol: 'FCFA' },
      { currency: 'MAD', rate: 9.95, symbol: 'MAD' },
      { currency: 'TND', rate: 3.10, symbol: 'DT' },
      { currency: 'DZD', rate: 134, symbol: 'DA' },
      { currency: 'LYD', rate: 4.82, symbol: 'LD' },
      { currency: 'TZS', rate: 2520, symbol: 'TSh' },
      { currency: 'UGX', rate: 3750, symbol: 'USh' },
      { currency: 'RWF', rate: 1280, symbol: 'RF' },
      { currency: 'ETB', rate: 56.50, symbol: 'Br' },
      { currency: 'BWP', rate: 13.50, symbol: 'P' },
      { currency: 'MUR', rate: 45, symbol: 'Rs' },
      { currency: 'SCR', rate: 13.20, symbol: 'SR' },
    ];

    const ancillaryPrices = { bags: 25, seats: 15, insurance: 12 };

    const config = new SystemConfig({
      b2bCommission: 5,
      b2cCommission: 10,
      whitelistedStates: ['Hawaii', 'California', 'Florida'],
      isWhitelistingEnabled: false,
      ancillaryMargin: 15,
      exchangeRates,
      ancillaryPrices,
      platformName: 'Flybeth Global'
    });

    await config.save();
    console.log(`Seeded ${exchangeRates.length} currencies.`);
    console.log(`Ancillary prices: bags=$${ancillaryPrices.bags}, seats=$${ancillaryPrices.seats}, insurance=$${ancillaryPrices.insurance}`);
    
    // Verify
    const doc = await SystemConfig.findOne();
    console.log('Verify - exchangeRates count:', doc.exchangeRates.length);
    console.log('Verify - first rate:', JSON.stringify(doc.exchangeRates[0]));
    console.log('Verify - ancillaryPrices:', JSON.stringify(doc.ancillaryPrices));
    console.log('DONE.');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
