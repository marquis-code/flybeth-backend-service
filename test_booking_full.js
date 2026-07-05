require('dotenv').config();
const { MongoClient } = require('mongodb');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db();
    const bookings = database.collection('bookings');
    const booking = await bookings.findOne({ pnr: "AVFWMF" });
    console.log(JSON.stringify(booking, null, 2));
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
