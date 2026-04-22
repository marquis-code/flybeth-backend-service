const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://flybeth:flybeth@flybeth.mqyheku.mongodb.net/?appName=flybeth';

async function seedPlatformTenant() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const TenantSchema = new mongoose.Schema({
      name: String,
      slug: { type: String, unique: true },
      status: String,
      contactEmail: String,
      onboardingStep: Number,
    }, { timestamps: true });

    const Tenant = mongoose.model('Tenant', TenantSchema, 'tenants');

    const platformSlug = 'flybeth';
    let platform = await Tenant.findOne({ slug: platformSlug });

    if (!platform) {
      platform = new Tenant({
        name: 'Flybeth Platform',
        slug: platformSlug,
        status: 'approved',
        contactEmail: 'admin@flybeth.com',
        onboardingStep: 7,
      });
      await platform.save();
      console.log('Platform tenant created:', platform._id);
    } else {
      console.log('Platform tenant already exists:', platform._id);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error seeding platform tenant:', err);
    process.exit(1);
  }
}

seedPlatformTenant();
