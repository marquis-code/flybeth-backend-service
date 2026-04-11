const mongoose = require('mongoose');

// Cloud URI from .env
const MONGODB_URI = "mongodb+srv://flybeth:flybeth@flybeth.mqyheku.mongodb.net/?appName=flybeth";

async function seed() {
    try {
        console.log('Connecting to cloud MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected successfully');

        // 1. Get an Admin User
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const admin = await User.findOne({ role: 'super_admin' }) 
                   || await User.findOne({ email: 'abahmarquis@gmail.com' })
                   || await User.findOne();
        
        if (!admin) {
            console.error('No user found to attribute campaigns to!');
            process.exit(1);
        }
        console.log(`Attributing campaigns to: ${admin.email} (${admin._id})`);

        // 2. Clear existing campaigns
        const Campaign = mongoose.model('Campaign', new mongoose.Schema({}, { strict: false }));
        await Campaign.deleteMany({});
        console.log('Cleared existing campaigns');

        // 3. Define 10 Campaigns
        const defaultCampaigns = [
          {
            title: "Welcome to Flybeth",
            subject: "Welcome aboard, {{firstName}}! ✈️ Your travel journey starts here",
            targetAudience: "all",
            status: "draft",
            createdBy: admin._id,
            content: `
              <h1>The World is Waiting for You</h1>
              <p>Hi {{firstName}}, we're thrilled to have you in the Flybeth community. Whether you're traveling for business or pleasure, we're here to make every flight seamless and affordable.</p>
              <img src="https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80&w=1200" alt="Airplane Wing" />
              <p>Log in to your account today to explore our global routes and exclusive member pricing.</p>
            `,
          },
          {
            title: "Valentine's Romantic Getaway",
            subject: "Love is in the Air ❤️ 15% Off Romantic Destinations",
            targetAudience: "all",
            status: "draft",
            createdBy: admin._id,
            content: `
              <h1 style="color: #e11d48;">Perfect Places for Two</h1>
              <p>Surprise your someone special with a trip to remember. This Valentine's, we're offering 15% off flights to Paris, Venice, and the Maldives.</p>
              <img src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&q=80&w=1200" alt="Beach Dinner" />
              <p>Book by Feb 14th to secure these special rates. Use promo code: LOVE2026</p>
            `,
          },
          {
            title: "Easter Family Specials",
            subject: "Hop Away for Easter! 🐇 Family Deals Inside",
            targetAudience: "all",
            status: "draft",
            createdBy: admin._id,
            content: `
              <h1>Easter Adventures for the Whole Family</h1>
              <p>Don't wait for the bunny! Book your Easter family break today and get free extra luggage on all domestic flights.</p>
              <img src="https://images.unsplash.com/photo-1522336572018-02880f3f9a62?auto=format&fit=crop&q=80&w=1200" alt="Countryside" />
              <p>Explore our 'Family First' destinations designed for maximum fun and minimum stress.</p>
            `,
          },
          {
            title: "Summer Early Bird Sale",
            subject: "☀️ Early Bird: 20% Off Your Summer Holiday!",
            targetAudience: "active",
            status: "draft",
            createdBy: admin._id,
            content: `
              <h1 style="color: #0d9488;">Beat the Summer Rush</h1>
              <p>It's never too early to plan for the sun. Book your July or August flights now and save up to 20% compared to last-minute prices.</p>
              <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200" alt="Tropical Beach" />
              <p>Secure your dream destination today with a small deposit and pay the rest later.</p>
            `,
          },
          {
            title: "Independence Day Promo",
            subject: "Celebrate Freedom with Free Upgrades! 🎆",
            targetAudience: "all",
            status: "draft",
            createdBy: admin._id,
            content: `
              <h1>Freedom to Fly Further</h1>
              <p>In celebration of Independence Day, we're giving away free business class upgrades on select long-haul routes.</p>
              <img src="https://images.unsplash.com/photo-1467139701929-18c0d27a7516?auto=format&fit=crop&q=80&w=1200" alt="Fireworks" />
              <p>Check your dashboard to see if your next flight qualifies for a luxury upgrade.</p>
            `,
          },
          {
            title: "Labor Day Weekend Escape",
            subject: "The Last Taste of Summer 🍹 Luxury Weekend Steals",
            targetAudience: "all",
            status: "draft",
            createdBy: admin._id,
            content: `
              <h1>Make the Most of the Long Weekend</h1>
              <p>End the season on a high note. We've curated the best city breaks for your Labor Day weekend escape.</p>
              <img src="https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&q=80&w=1200" alt="City Skyline" />
              <p>Flights starting from just $99. Limited seats available!</p>
            `,
          },
          {
            title: "Black Friday Mega Sale",
            subject: "💥 THE BIGGEST SALE OF THE YEAR: Up to 50% Off!",
            targetAudience: "all",
            status: "draft",
            createdBy: admin._id,
            content: `
              <h1 style="color: #000; background: #fbbf24; padding: 10px; display: inline-block;">BLACK FRIDAY IS HERE</h1>
              <p>This is it! Our biggest price drop ever. 50% off international flights and 30% off hotel bookings through Flybeth.</p>
              <img src="https://images.unsplash.com/photo-1607083206325-caf1edba7a0f?auto=format&fit=crop&q=80&w=1200" alt="Shopping Sale" />
              <p>Hurry! These prices vanish at midnight on Cyber Monday.</p>
            `,
          },
          {
            title: "Christmas Home-Coming",
            subject: "Go Home for the Holidays 🎄 Special Family Rates",
            targetAudience: "all",
            status: "draft",
            createdBy: admin._id,
            content: `
              <h1>Christmas is Better Together</h1>
              <p>Nothing beats waking up at home on Christmas morning. We've locked in special rates for travel between Dec 20-27.</p>
              <img src="https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&q=80&w=1200" alt="Christmas Decorations" />
              <p>Book early to avoid the holiday rush and ensure you're there for the festivities.</p>
            `,
          },
          {
            title: "New Year, New Destinations",
            subject: "Where will 2026 take you? 🌍 New Year Deals",
            targetAudience: "all",
            status: "draft",
            createdBy: admin._id,
            content: `
              <h1>Your 2026 Bucket List Starts Now</h1>
              <p>Happy New Year! Start the year right by ticking off one of those dream destinations. We're offering double loyalty points on all January bookings.</p>
              <img src="https://images.unsplash.com/photo-1493246507139-91e8bef99c02?auto=format&fit=crop&q=80&w=1200" alt="Mountain Peak" />
              <p>New year, new sights, new memories with Flybeth.</p>
            `,
          },
          {
            title: "Membership Anniversary Reward",
            subject: "A Special Gift for You, {{firstName}} 🎁",
            targetAudience: "active",
            status: "draft",
            createdBy: admin._id,
            content: `
              <h1>Thanks for Traveling with Us</h1>
              <p>Hi {{firstName}}, it's been a year since you joined Flybeth! To celebrate our anniversary together, we've added a $50 travel credit to your wallet.</p>
              <img src="https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=1200" alt="Celebration" />
              <p>This credit is valid for any flight booking over the next 3 months. Happy Anniversary!</p>
            `,
          }
        ];

        // 4. Insert Campaigns
        await Campaign.insertMany(defaultCampaigns);
        console.log('Successfully seeded 10 campaigns to cloud DB with attributed createdBy.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding Failed:', err);
        process.exit(1);
    }
}

seed();
