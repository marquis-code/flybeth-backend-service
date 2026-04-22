const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://flybeth:flybeth@flybeth.mqyheku.mongodb.net/?appName=flybeth";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
