const { MongoClient } = require('mongodb');
require('dotenv').config();

async function check() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('test'); // Or whatever the DB name is, maybe it's flybeth? Let's query admin db to get the name
  
  // Actually mongoose uses flybeth
  const flybethDb = client.db('flybeth') || client.db('test');
  
  const bookings = await flybethDb.collection('bookings').find({}).sort({ createdAt: -1 }).limit(3).toArray();
  console.log("Recent bookings:");
  for (const b of bookings) {
    console.log(`- ID: ${b._id}, Status: ${b.status}, RemoteOrderId: ${b.remoteOrderId}, Error/Notes: ${b.notes || ''}`);
  }
  
  await client.close();
}
check().catch(console.error);
