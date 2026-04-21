import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

const MONGODB_URI = "mongodb+srv://flybeth:flybeth@flybeth.mqyheku.mongodb.net/?appName=flybeth";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const RoleSchema = new mongoose.Schema({
    name: String,
    permissions: [String],
  }, { strict: false });

  const UserSchema = new mongoose.Schema({
    email: String,
    password: { type: String, select: false },
    firstName: String,
    lastName: String,
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    isActive: Boolean,
    isVerified: Boolean,
    otp: String,
    otpExpiry: Date,
  }, { strict: false });

  const Role = mongoose.model('Role', RoleSchema, 'roles');
  const User = mongoose.model('User', UserSchema, 'users');

  const adminRole = await Role.findOne({ name: 'super_admin' });
  if (!adminRole) {
    console.error('Super Admin role not found!');
    process.exit(1);
  }

  const email = 'admin@flybeth.com';
  const password = 'Flybeth2026@.';
  const hashedPassword = await bcrypt.hash(password, 12);
  const otp = '123456';
  const otpExpiry = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000); // 10 years expiry for demo

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
    firstLogin: false
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
