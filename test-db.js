const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function run() {
  await mongoose.connect('mongodb+srv://flybeth:flybeth@flybeth.mqyheku.mongodb.net/?appName=flybeth');
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({ email: "agent@flybeth.com" });
  if (user) {
    console.log("Found agent user:", user.email);
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash("Agent@2026!", salt);
    await db.collection('users').updateOne(
      { email: "agent@flybeth.com" },
      { $set: { password: hash, role: "agent" } }
    );
    console.log("Updated password for agent@flybeth.com");
  } else {
    console.log("Agent user not found in DB. Need to restart server to trigger seed.");
  }
  process.exit(0);
}
run().catch(console.error);
