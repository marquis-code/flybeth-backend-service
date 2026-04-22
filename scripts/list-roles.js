const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://flybeth:flybeth@flybeth.mqyheku.mongodb.net/?appName=flybeth";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const RoleSchema = new mongoose.Schema({
    name: String,
  }, { strict: false });

  const Role = mongoose.model('Role', RoleSchema, 'roles');

  const roles = await Role.find({});
  console.log('Available roles:', roles.map(r => r.name));
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
