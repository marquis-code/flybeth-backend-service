const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://flybeth:flybeth@flybeth.mqyheku.mongodb.net/?appName=flybeth';

async function clearData() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');
  
  const collectionsToClear = [
    'bookings', 'flights', 'stays', 'cars', 'cruises', 'packages', 'itineraries',
    'payments', 'transactions', 'invoices',
    'campaigns', 'marketingcampaigns',
    'notifications', 'invitations', 'contactinquiries', 'audit_logs', 'trackingevents',
    'searchsessions', 'recentsearches', 'passengers'
  ];

  for (const c of collectionsToClear) {
    try {
      const result = await mongoose.connection.collection(c).deleteMany({});
      console.log(`Cleared ${result.deletedCount} from ${c}`);
    } catch(e) {
      console.log(`Failed to clear ${c}:`, e.message);
    }
  }

  // Clear all users except admin
  const usersResult = await mongoose.connection.collection('users').deleteMany({ email: { $ne: 'admin@flybeth.com' } });
  console.log(`Cleared ${usersResult.deletedCount} users (kept admin@flybeth.com)`);

  // Clear all tenants except platform
  const tenantsResult = await mongoose.connection.collection('tenants').deleteMany({ slug: { $ne: 'flybeth' } });
  console.log(`Cleared ${tenantsResult.deletedCount} tenants (kept flybeth)`);

  process.exit(0);
}

clearData();
