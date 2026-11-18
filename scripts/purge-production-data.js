const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://flybeth:flybeth@flybeth.mqyheku.mongodb.net/?appName=flybeth';

async function purgeProductionData() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;

  const collectionsToWipe = [
    'bookings',
    'payments',
    'passengers',
    'audit_logs',
    'trackingevents',
    'chatmessages',
    'chatrooms',
    'campaigns',
    'marketingcampaigns',
    'subscribers',
    'newslettersubscribers',
    'newslettersubscriptions',
    'contactinquiries',
    'support_tickets',
    'invoices',
    'transactions',
    'wallets',
    'wallettransactions',
    'searchsessions',
    'recentsearches'
  ];

  console.log('\n--- Purging Dummy Operational & Financial Records ---');
  for (const colName of collectionsToWipe) {
    try {
      const col = db.collection(colName);
      const exists = await col.countDocuments().catch(() => null);
      if (exists !== null) {
        const result = await col.deleteMany({});
        console.log(`[PURGED] ${colName}: deleted ${result.deletedCount} documents`);
      }
    } catch (err) {
      console.warn(`[SKIP] ${colName}: ${err.message}`);
    }
  }

  console.log('\n--- Purging Dummy / Test User Accounts ---');
  const allowedAdminEmails = [
    'abahmarquis@gmail.com',
    'admin@flybeth.com',
    'flybethweb@gmail.com'
  ];

  try {
    const userCol = db.collection('users');
    const result = await userCol.deleteMany({
      email: { $nin: allowedAdminEmails }
    });
    console.log(`[PURGED] users: deleted ${result.deletedCount} test/demo user accounts`);

    const remainingUsers = await userCol.find({}).project({ email: 1, firstName: 1, lastName: 1, role: 1 }).toArray();
    console.log('Remaining verified Admin accounts:', remainingUsers);
  } catch (err) {
    console.error('Failed to clean users:', err.message);
  }

  console.log('\n--- Verifying Core System Infrastructure Collections (Untouched) ---');
  const coreCollections = [
    'tenants',
    'roles',
    'roleentities',
    'permissionentities',
    'systemconfigs',
    'bank_accounts',
    'airports',
    'airlines',
    'departments',
    'emailtemplates',
    'currencies',
    'exchange_rates'
  ];

  for (const col of coreCollections) {
    const count = await db.collection(col).countDocuments().catch(() => 0);
    console.log(`[PRESERVED] ${col}: ${count} records`);
  }

  console.log('\n=== Purge Completed Successfully ===');
  await mongoose.disconnect();
  process.exit(0);
}

purgeProductionData().catch(err => {
  console.error('Fatal Purge Error:', err);
  process.exit(1);
});
