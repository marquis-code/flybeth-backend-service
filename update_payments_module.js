const fs = require('fs');

const path = 'src/modules/payments/payments.module.ts';
let content = fs.readFileSync(path, 'utf8');

// Add import
const importCashApp = 'import { CashAppProvider } from "./providers/cashapp.provider";';
const importAfterpay = importCashApp + '\nimport { AfterpayProvider } from "./providers/afterpay.provider";';
content = content.replace(importCashApp, importAfterpay);

// Add to providers
const providersList = 'CashAppProvider,';
const newProvidersList = 'CashAppProvider,\n    AfterpayProvider,';
content = content.replace(providersList, newProvidersList);

fs.writeFileSync(path, content, 'utf8');
