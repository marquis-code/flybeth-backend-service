import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Campaign, CampaignDocument } from "./schemas/campaign.schema";
import { NotificationsService } from "../notifications/notifications.service";
import { UsersService } from "../users/users.service";
import { Role } from "../../common/constants/roles.constant";

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
  ) {}

  async findAll() {
    return this.campaignModel
      .find()
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .exec();
  }

  async create(data: any) {
    const campaign = new this.campaignModel(data);
    return campaign.save();
  }

  async update(id: string, data: any) {
    return this.campaignModel.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string) {
    return this.campaignModel.findByIdAndDelete(id);
  }

  async sendCampaign(id: string) {
    const campaign = await this.campaignModel.findById(id);
    if (!campaign) throw new Error("Campaign not found");

    let query: any = {};
    if (campaign.targetAudience === "active") {
      query = { status: "active" };
    } else if (
      campaign.targetAudience === "roles" &&
      campaign.targetRoles?.length > 0
    ) {
      query = { role: { $in: campaign.targetRoles } };
    } else if (
      campaign.targetAudience === "specific" &&
      campaign.specificUsers?.length > 0
    ) {
      query = { _id: { $in: campaign.specificUsers } };
    }
    // "all" uses an empty query to retrieve everyone.

    // Using usersService.findAll could impose pagination limits. For campaign blasts we need all targeted users.
    // However, depending on how usersService is structured, we will use it with a large limit.
    const usersResponse = await this.usersService.findAll({
      limit: 100000,
    }, query);
    let users: any[] = usersResponse.data || [];

    // Inject Custom Emails (External guests)
    if (campaign.customEmails && campaign.customEmails.length > 0) {
      const externalUsers = campaign.customEmails.map((email) => ({
        email: email.trim(),
        firstName: "Guest",
        lastName: "User",
      }));
      users = [...users, ...externalUsers];
    }

    this.logger.log(
      `Starting campaign blast: ${campaign.title} to ${users.length} users`,
    );

    // Prepend the attachment image if it exists
    let baseContent = campaign.content;
    if (campaign.imageUrl) {
      baseContent =
        `<div style="text-align: center; margin-bottom: 20px;"><img src="${campaign.imageUrl}" style="max-width: 100%; border-radius: 8px;" alt="Campaign Attachment" /></div>` +
        baseContent;
    }

    for (const user of users) {
      // Safe fallback variable replacement
      const userContent = baseContent
        .replace(/\{\{firstName\}\}/g, user.firstName || "Guest")
        .replace(/\{\{lastName\}\}/g, user.lastName || "User");

      const userSubject = campaign.subject
        .replace(/\{\{firstName\}\}/g, user.firstName || "Guest")
        .replace(/\{\{lastName\}\}/g, user.lastName || "User");

      const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
             @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');
             body { 
               margin: 0; 
               padding: 0; 
               background-color: #f8fafc; 
               font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
               color: #334155;
             }
             .wrapper { padding: 50px 20px; text-align: center; }
             .container { 
               background-color: #ffffff; 
               max-width: 640px; 
               margin: 0 auto; 
               padding: 50px; 
               border-radius: 32px; 
               box-shadow: 0 40px 80px rgba(13, 29, 173, 0.08); 
               border: 1px solid rgba(226, 232, 240, 0.8);
               text-align: left;
             }
             .header { text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 1px solid #f1f5f9; }
             .logo { height: 40px; width: auto; display: block; margin: 0 auto; }
             .content { font-size: 17px; line-height: 1.8; color: #475569; }
             .content h1 { color: #0f172a; font-size: 32px; font-weight: 800; margin-bottom: 24px; letter-spacing: -1px; }
             .content p { margin-bottom: 24px; }
             .content img { max-width: 100%; height: auto; border-radius: 20px; display: block; margin: 30px auto; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
             .footer { text-align: center; margin-top: 50px; padding-top: 30px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #94a3b8; line-height: 1.8; font-weight: 500; }
             .footer-brand { color: #0D1DAD; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <img src="https://flybeth.s3.us-east-2.amazonaws.com/flight-booking/general/logo.png" alt="Flybeth" class="logo" />
              </div>
              <div class="content">
                ${userContent}
              </div>
              <div class="footer">
                <div class="footer-brand">Flybeth Global</div>
                &copy; ${new Date().getFullYear()} Flybeth Travel. All rights reserved.<br>
                1880 S Dairy Ashford Rd, Suite 207, Houston, TX 77077
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.notificationsService.sendEmail(
        user.email,
        userSubject,
        htmlTemplate,
        {
          firstName: user.firstName || "Guest",
          lastName: user.lastName || "User",
        },
      );
    }

    campaign.status = "sent";
    await campaign.save();
    return { sent: users.length };
  }
  async seedDefaultCampaigns() {
    // Find a super-admin to attribute these campaigns to
    const admin = await this.usersService.findAll({ limit: 1 }, { role: Role.SUPER_ADMIN });
    const adminId = admin.data?.[0]?._id || admin.data?.[0]?.id;

    if (!adminId) {
       this.logger.error("Seeding failed: No Super Admin found to attribute campaigns to.");
       return { success: false, message: "No Super Admin found" };
    }

    // Aggressively clear existing campaigns to ensure only the 10 premium templates are present
    await this.campaignModel.deleteMany({});

    const defaultCampaigns = [
      {
        title: "Welcome to Flybeth",
        subject: "Welcome aboard, {{firstName}}! ✈️ Your travel journey starts here",
        targetAudience: "all",
        status: "draft",
        createdBy: adminId,
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
        createdBy: adminId,
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
        createdBy: adminId,
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
        createdBy: adminId,
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
        createdBy: adminId,
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
        createdBy: adminId,
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
        createdBy: adminId,
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
        createdBy: adminId,
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
        createdBy: adminId,
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
        createdBy: adminId,
        content: `
          <h1>Thanks for Traveling with Us</h1>
          <p>Hi {{firstName}}, it's been a year since you joined Flybeth! To celebrate our anniversary together, we've added a $50 travel credit to your wallet.</p>
          <img src="https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=1200" alt="Celebration" />
          <p>This credit is valid for any flight booking over the next 3 months. Happy Anniversary!</p>
        `,
      }
    ];

    await this.campaignModel.insertMany(defaultCampaigns);
    return { success: true, message: "10 high-value campaigns seeded aggressively", count: defaultCampaigns.length };
  }
}
