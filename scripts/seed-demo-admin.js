const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = "mongodb+srv://flybeth:flybeth@flybeth.mqyheku.mongodb.net/?appName=flybeth";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const RoleSchema = new mongoose.Schema({
    name: String,
  }, { strict: false });

  const UserSchema = new mongoose.Schema({
    email: String,
    password: { type: String, select: false },
    firstName: String,
    lastName: String,
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    isActive: Boolean,
    isVerified: Boolean,
    otp: { type: String },
    otpExpiry: { type: Date },
    firstLogin: { type: Boolean },
    failedLoginAttempts: { type: Number },
    lockUntil: { type: Date }
  }, { strict: false });

  const Role = mongoose.model('Role', RoleSchema, 'roleentities');
  const User = mongoose.model('User', UserSchema, 'users');

  // Try different common admin role names
  let adminRole = await Role.findOne({ name: { $in: ['super_admin', 'SUPER_ADMIN', 'admin', 'Admin'] } });
  
  if (!adminRole) {
    console.error('Admin role not found! Available roles:', await Role.find({}).then(rs => rs.map(r => r.name)));
    process.exit(1);
  }
  
  console.log(`Using role: ${adminRole.name} (${adminRole._id})`);

  const email = 'admin@flybeth.com';
  const password = 'Flybeth2026@.';
  const hashedPassword = await bcrypt.hash(password, 12);
  const otp = '123456';
  const otpExpiry = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000); 

  const updateData = {
    email: email.toLowerCase(),
    password: hashedPassword,
    firstName: 'Demo',
    lastName: 'Admin',
    role: adminRole._id,
    isActive: true,
    isVerified: true,
    otp: otp,
    otpExpiry: otpExpiry,
    firstLogin: false,
    failedLoginAttempts: 0,
    lockUntil: null
  };

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: updateData },
    { upsert: true, new: true }
  );

  console.log('Admin user created/updated successfully:', user.email);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
