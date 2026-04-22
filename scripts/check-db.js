const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://flybeth:flybeth@flybeth.mqyheku.mongodb.net/?appName=flybeth';

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections in DB:', collections.map(c => c.name));

    const collection = db.collection('systemconfigs');
    const docs = await collection.find({}).toArray();
    console.log('Count of docs in systemconfigs:', docs.length);
    if (docs.length > 0) {
      console.log('First doc currencies:', JSON.stringify(docs[0].exchangeRates, null, 2));
      console.log('First doc ancillaryPrices:', JSON.stringify(docs[0].ancillaryPrices, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

check();
