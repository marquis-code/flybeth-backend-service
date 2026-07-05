require('dotenv').config();
const { MongoClient } = require('mongodb');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error("No MONGODB_URI"); return; }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db();
    const bookings = database.collection('bookings');
    const booking = await bookings.findOne({ pnr: "AVFWMF" });
    if (!booking) { console.error("No booking AVFWMF"); return; }
    console.log(JSON.stringify(booking.flights, null, 2));
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
