const mongoose = require('mongoose');

// Seasonal Campaigns Seed Data for All Year Events
const campaigns = [
  {
    title: 'New Year Resolution: Travel More',
    subject: '🎉 Kick off 2027 with our New Year Flight Deals!',
    content: '<h2>Happy New Year!</h2><p>Make good on your resolution to travel more. Book your first getaway of the year and enjoy exclusive early-bird discounts to Asia and Europe!</p><p><a href="#">Book Your Trip</a></p>',
    status: 'draft',
    targetAudience: 'all',
    targetRoles: ['customer'],
    imageUrl: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&q=80',
  },
  {
    title: 'Valentines Day Romantic Getaways',
    subject: '❤️ Whisk them away! Romantic flights for two',
    content: '<h2>Love is in the air</h2><p>Surprise your special someone with a surprise trip to Paris, Rome, or the Maldives. Book two tickets and save 30% on the second fare!</p><p><a href="#">Find Romantic Escapes</a></p>',
    status: 'draft',
    targetAudience: 'active',
    targetRoles: ['customer'],
    imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80',
  },
  {
    title: 'Easter Weekend Flights',
    subject: '🐰 Hop on a plane this Easter Weekend!',
    content: '<h2>Easter Flash Sale</h2><p>Visit family or take a quick spring vacation. Our Easter weekend flights are up to 15% off across all domestic routes.</p>',
    status: 'draft',
    targetAudience: 'all',
    targetRoles: ['customer'],
    imageUrl: 'https://images.unsplash.com/photo-1522345095360-15501861cb7e?w=800&q=80',
  },
  {
    title: 'Mothers Day Gift',
    subject: '🌸 Treat Mom to a well-deserved vacation!',
    content: '<h2>Happy Mothers Day</h2><p>Give her the gift of travel. Purchase a Flybeth travel voucher or book a spa weekend getaway in Bali or Hawaii.</p>',
    status: 'draft',
    targetAudience: 'all',
    targetRoles: ['customer'],
    imageUrl: 'https://images.unsplash.com/photo-1490750967868-88cb4ec06543?w=800&q=80',
  },
  {
    title: 'Black Friday Mega Sale',
    subject: '🖤 BLACK FRIDAY: Our Biggest Sale of the Year!',
    content: '<h2>Huge Black Friday Savings</h2><p>This is it! Flights as low as $49 one-way. International travel up to 40% off. Book before midnight!</p><p><a href="#">Shop Black Friday</a></p>',
    status: 'scheduled',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 150),
    targetAudience: 'all',
    targetRoles: ['customer'],
    imageUrl: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800&q=80',
  },
  {
    title: 'Cyber Monday Extensions',
    subject: '💻 Last chance! Cyber Monday flight deals are here',
    content: '<h2>Cyber Monday is LIVE</h2><p>Missed Black Friday? We have got you covered. Check out our exclusive online-only flight and hotel packages.</p>',
    status: 'draft',
    targetAudience: 'all',
    targetRoles: ['customer'],
    imageUrl: 'https://images.unsplash.com/photo-1531315630201-bb15abeb1653?w=800&q=80',
  },
  {
    title: 'Thanksgiving Homecomings',
    subject: '🦃 Fly home for Thanksgiving without breaking the bank',
    content: '<h2>Home for the Holidays</h2><p>Thanksgiving flights are filling up fast! Book now to secure your seat and spend the holiday with the ones you love.</p>',
    status: 'draft',
    targetAudience: 'airline',
    targetAirline: 'United Airlines',
    targetRoles: ['customer'],
    imageUrl: 'https://images.unsplash.com/photo-1511699709289-4bc7ee26be0c?w=800&q=80',
  },
  {
    title: 'Christmas Early Bird',
    subject: '🎄 Book your Christmas flights early and save!',
    content: '<h2>Merry Christmas</h2><p>Beat the holiday rush. Our Christmas flight schedules are now open, and early birds get the best prices.</p>',
    status: 'draft',
    targetAudience: 'all',
    targetRoles: ['customer'],
    imageUrl: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=800&q=80',
  },
  {
    title: 'Independence Day Fireworks',
    subject: '🎆 4th of July Specials: Fly across the USA!',
    content: '<h2>Celebrate Independence Day</h2><p>Where are you watching the fireworks? Book domestic flights for the 4th of July weekend and save up to 25%.</p>',
    status: 'draft',
    targetAudience: 'all',
    targetRoles: ['customer'],
    imageUrl: 'https://images.unsplash.com/photo-1531102927284-9844e135a507?w=800&q=80',
  },
  {
    title: 'Halloween Spooky Flights',
    subject: '🎃 Scary good flight deals inside!',
    content: '<h2>No Tricks, Just Trips!</h2><p>Our Halloween flash sale is on. Fly to Transylvania, Salem, or just visit friends. Grab these deals before they vanish like a ghost!</p>',
    status: 'draft',
    targetAudience: 'all',
    targetRoles: ['customer'],
    imageUrl: 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=800&q=80',
  }
];

async function seed() {
  try {
    await mongoose.connect('mongodb+srv://flybeth:flybeth@flybeth.mqyheku.mongodb.net/?appName=flybeth');
    console.log('Connected to MongoDB');

    const user = await mongoose.connection.db.collection('users').findOne({ role: 'admin' }) || 
                 await mongoose.connection.db.collection('users').findOne({});
                 
    if (!user) {
      console.log('No user found to assign as creator.');
      process.exit(1);
    }

    const campaignDocs = campaigns.map(c => ({
      ...c,
      createdBy: user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await mongoose.connection.db.collection('campaigns').insertMany(campaignDocs);
    console.log(`Successfully seeded ${campaignDocs.length} holiday campaigns!`);

  } catch (error) {
    console.error('Error seeding campaigns:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
