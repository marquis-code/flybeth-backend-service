const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://flybeth:flybeth@flybeth.mqyheku.mongodb.net/?appName=flybeth';

async function updateEmail() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');
  
  const result = await mongoose.connection.collection('users').updateOne(
    { email: 'admin@flybeth.com' },
    { $set: { email: 'flybethweb@gmail.com' } }
  );

  console.log(`Updated ${result.modifiedCount} user email.`);
  process.exit(0);
}

updateEmail();
