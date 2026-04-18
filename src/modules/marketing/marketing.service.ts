import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MarketingCampaign, MarketingCampaignDocument } from './schemas/campaign.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { PassengersService } from '../passengers/passengers.service';
import { ResendService } from '../notifications/resend.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name);

  constructor(
    @InjectModel(MarketingCampaign.name) private campaignModel: Model<MarketingCampaignDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    private readonly passengersService: PassengersService,
    private readonly resendService: ResendService,
  ) {}

  async create(tenantId: string, senderId: string, data: any): Promise<MarketingCampaignDocument> {
    const { _id, customRecipients, ...rest } = data;
    
    const effectiveStatus = data.status || (data.scheduledAt ? 'queued' : 'draft');
    
    const campaign = new this.campaignModel({
      ...rest,
      tenant: new Types.ObjectId(tenantId),
      sender: new Types.ObjectId(senderId),
      createdBy: new Types.ObjectId(senderId),
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      status: effectiveStatus,
      filters: {
        target: data.target || 'all',
        emails: data.targetEmails ? data.targetEmails.split(',').map(e => e.trim()).filter(Boolean) : undefined
      }
    });
    
    const saved = await campaign.save();

    // If the agent chose "Send Now" (status === 'sent'), immediately dispatch emails
    if (effectiveStatus === 'sent') {
      // Don't await — fire and forget so the response returns quickly
      this.sendCampaign(saved._id.toString()).catch(e =>
        this.logger.error(`Immediate send for campaign ${saved._id} failed: ${e.message}`),
      );
    }

    return saved;
  }

  async findAll(tenantId: string): Promise<MarketingCampaignDocument[]> {
    return this.campaignModel.find({ tenant: new Types.ObjectId(tenantId) }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<MarketingCampaignDocument> {
    const campaign = await this.campaignModel.findById(id).exec();
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async update(id: string, tenantId: string, data: any): Promise<MarketingCampaignDocument> {
    const { _id, customRecipients, ...rest } = data;
    
    const updatePayload: any = { ...rest };
    if (data.targetEmails) {
      updatePayload.filters = {
        target: data.target || 'all',
        emails: data.targetEmails.split(',').map(e => e.trim()).filter(Boolean),
      };
    }
    
    const campaign = await this.campaignModel.findOneAndUpdate(
      { _id: id, tenant: new Types.ObjectId(tenantId) },
      { $set: updatePayload },
      { new: true }
    ).exec();
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.campaignModel.deleteOne({ 
      _id: id, 
      tenant: new Types.ObjectId(tenantId) 
    }).exec();
    if (result.deletedCount === 0) throw new NotFoundException('Campaign not found');
  }

  async getStats(tenantId: string) {
    const campaigns = await this.campaignModel.find({ tenant: new Types.ObjectId(tenantId) }).exec();
    
    const sent = campaigns.filter(c => c.status === 'sent');
    const totalRecipients = sent.reduce((acc, curr) => acc + (curr.recipientCount || 0), 0);
    
    return {
      totalCampaigns: campaigns.length,
      sentCampaigns: sent.length,
      totalRecipients,
      scheduled: campaigns.filter(c => c.status === 'queued').length,
      avgOpenRate: '0%', 
      conversionRate: '0%'
    };
  }

  async sendCampaign(id: string): Promise<void> {
    const campaign = await this.findOne(id);
    if (campaign.status === 'sent') {
      // Check if emails were already dispatched (recipientCount > 0)
      if (campaign.recipientCount > 0) return;
    }

    campaign.status = 'sending';
    await campaign.save();

    try {
      let emails: string[] = [];

      if (campaign.filters?.emails && campaign.filters.emails.length > 0) {
        emails = campaign.filters.emails;
      } else {
        // Fetch all tenant users
        const users = await this.usersService.getTenantUsers(campaign.tenant.toString(), { limit: 1000 });
        emails = users.data.map(u => u.email);
      }

      this.logger.log(`Campaign ${id}: Dispatching to ${emails.length} recipients: ${emails.join(', ')}`);

      // Wrap the agent's HTML content in the branded email template
      const brandedHtml = this.resendService.brandWrapper(campaign.title, campaign.content);

      for (const email of emails) {
        try {
          await this.notificationsService.sendEmail(
            email,
            campaign.subject,
            brandedHtml
          );
          this.logger.log(`Campaign ${id}: Email dispatched to ${email}`);
        } catch (emailErr) {
          this.logger.error(`Campaign ${id}: Failed to send to ${email}: ${emailErr.message}`);
        }
      }

      campaign.status = 'sent';
      campaign.sentAt = new Date();
      campaign.recipientCount = emails.length;
      await campaign.save();
      this.logger.log(`Campaign ${id}: Successfully sent to ${emails.length} recipients`);
    } catch (e) {
      campaign.status = 'failed';
      await campaign.save();
      this.logger.error(`Campaign ${id} failed: ${e.message}`);
    }
  }

  async getTemplates(tenantId: string): Promise<MarketingCampaignDocument[]> {
    return this.campaignModel.find({ isTemplate: true }).sort({ createdAt: -1 }).exec();
  }

  async seedTemplates(tenantId: string, senderId: string): Promise<void> {
    const existingTemplates = await this.campaignModel.countDocuments({ isTemplate: true, tenant: new Types.ObjectId(tenantId) }).exec();
    if (existingTemplates > 0) {
      this.logger.log('Marketing templates already seeded, skipping');
      return;
    }

    const templates = [
      {
        title: 'Flash Sale: Exclusive Flight Deals',
        subject: '🔥 Up to 40% Off Flights — This Weekend Only!',
        templateCategory: 'promotion',
        content: `
          <h2 style="text-align: center;">🔥 Flash Sale Alert</h2>
          <p>Dear Valued Traveler,</p>
          <p>For a <strong>limited time only</strong>, we're offering incredible discounts on select domestic and international routes. Whether you're planning a quick getaway or a long-awaited vacation, now is the perfect time to book.</p>
          <blockquote><strong>Use code FLYBIG40 at checkout to save up to 40%.</strong></blockquote>
          <h3>Featured Routes:</h3>
          <ul>
            <li><strong>Lagos → London</strong> — from $450 return</li>
            <li><strong>Abuja → Dubai</strong> — from $380 return</li>
            <li><strong>Port Harcourt → Accra</strong> — from $220 return</li>
          </ul>
          <p>This offer expires <strong>Sunday at midnight</strong>. Don't let this opportunity fly away!</p>
          <p>Safe travels,<br/><strong>The Flybeth Team</strong></p>
        `,
        coverImage: '',
      },
      {
        title: 'Booking Confirmation Follow-Up',
        subject: '✈️ Your Trip is Booked — Here\'s What to Know',
        templateCategory: 'transactional',
        content: `
          <h2 style="text-align: center;">✈️ You're All Set!</h2>
          <p>Dear Traveler,</p>
          <p>Thank you for booking your flight with us! We're excited to be part of your journey. Here's a quick checklist to make sure you're fully prepared:</p>
          <h3>Pre-Flight Checklist:</h3>
          <ul>
            <li>✅ <strong>Passport & Travel Documents</strong> — Ensure they're valid for at least 6 months</li>
            <li>✅ <strong>Online Check-In</strong> — Opens 24 hours before departure</li>
            <li>✅ <strong>Baggage Allowance</strong> — Review your airline's policy</li>
            <li>✅ <strong>Travel Insurance</strong> — Protect your trip from unexpected events</li>
          </ul>
          <p>Need to make changes? Simply log into your dashboard or contact our support team anytime.</p>
          <p>Bon voyage!<br/><strong>The Flybeth Team</strong></p>
        `,
        coverImage: '',
      },
      {
        title: 'Holiday Season Travel Guide',
        subject: '🌍 Plan Your Perfect Holiday Getaway',
        templateCategory: 'seasonal',
        content: `
          <h2 style="text-align: center;">🌍 Holiday Travel Guide 2026</h2>
          <p>Dear Explorer,</p>
          <p>The holiday season is approaching fast, and the best fares won't last! Whether you're dreaming of <em>tropical beaches</em>, <em>European Christmas markets</em>, or a <em>safari adventure</em>, we've curated the perfect destinations for you.</p>
          <h3>Top Holiday Destinations:</h3>
          <ul>
            <li>🏖️ <strong>Maldives</strong> — Crystal-clear waters and overwater villas</li>
            <li>🎄 <strong>Vienna, Austria</strong> — Enchanting Christmas markets</li>
            <li>🦁 <strong>Serengeti, Tanzania</strong> — Witness the Great Migration</li>
            <li>🗼 <strong>Paris, France</strong> — The city of love in winter</li>
          </ul>
          <blockquote>Book before November 30th and receive a <strong>complimentary airport lounge pass</strong> for your departure.</blockquote>
          <p>Start planning your dream holiday today!</p>
          <p>Warm regards,<br/><strong>The Flybeth Team</strong></p>
        `,
        coverImage: '',
      },
      {
        title: 'Loyalty Reward: Thank You for Flying With Us',
        subject: '🎁 A Special Reward Just For You',
        templateCategory: 'retention',
        content: `
          <h2 style="text-align: center;">🎁 Thank You, Loyal Traveler!</h2>
          <p>Dear Valued Customer,</p>
          <p>We truly appreciate your loyalty. As a token of our gratitude for choosing Flybeth for your travels, we'd like to offer you an <strong>exclusive reward</strong>.</p>
          <h3>Your Exclusive Benefits:</h3>
          <ul>
            <li>🎫 <strong>15% Discount</strong> on your next booking (code: LOYAL15)</li>
            <li>💼 <strong>Free Extra Baggage</strong> — One additional 23kg bag on your next flight</li>
            <li>⭐ <strong>Priority Check-In</strong> — Skip the queue on your next departure</li>
          </ul>
          <p>These perks are valid for the next <strong>60 days</strong>. We can't wait to welcome you aboard again!</p>
          <p>With gratitude,<br/><strong>The Flybeth Team</strong></p>
        `,
      },
      {
        title: 'Valentine\'s Day: Romantic Getaways',
        subject: '💖 Spoil Your Loved One This Valentine\'s Day!',
        templateCategory: 'seasonal',
        content: `
          <h2 style="text-align: center;">💖 Romantic Escapes for Two</h2>
          <p>Dear Romantic,</p>
          <p>Valentine's Day is just around the corner! Whether you're celebrating an anniversary, a honeymoon, or simply need an excuse to sweep your partner off their feet, we have the perfect romantic packages.</p>
          <h3>Top Retreats for Couples:</h3>
          <ul>
            <li>🥂 <strong>Santorini, Greece</strong> — Sunsets & wine tasting</li>
            <li>🚤 <strong>Venice, Italy</strong> — Gondola rides through historic canals</li>
            <li>🏔️ <strong>Swiss Alps</strong> — Cozy chalets and hot chocolate</li>
          </ul>
          <blockquote><strong>Use code LOVE2026 to unlock a free hotel room upgrade with your flight booking!</strong></blockquote>
          <p>Make this Lover's Day unforgettable.</p>
          <p>With love,<br/><strong>The Flybeth Team</strong></p>
        `,
        coverImage: '',
      },
      {
        title: 'Black Friday Mega Flight Sale',
        subject: '⬛ Black Friday is HERE: Our Biggest Discounts of the Year!',
        templateCategory: 'promotion',
        content: `
          <h2 style="text-align: center;">🛒 The Black Friday Mega Sale!</h2>
          <p>Dear Traveler,</p>
          <p>The wait is over! It's the biggest shopping day of the year, and our travel deals are breaking records. We've slashed prices across our entire network.</p>
          <h3>Exclusive Black Friday Deals:</h3>
          <ul>
            <li>✈️ <strong>Up to 50% off</strong> all long-haul flights</li>
            <li>🏨 <strong>Buy 1 Get 1 Free</strong> on select hotel nights</li>
            <li>💳 <strong>Double Points</strong> on all bookings made today</li>
          </ul>
          <p><em>Warning: Seats at these prices are highly limited and will sell out within hours.</em></p>
          <p>Don't wait. Grab your tickets now before they're gone!</p>
          <p>Happy travels,<br/><strong>The Flybeth Team</strong></p>
        `,
        coverImage: '',
      },
      {
        title: 'Summer Escapes: Beat the Heat',
        subject: '☀️ Summer is Calling: Where Will You Go?',
        templateCategory: 'seasonal',
        content: `
          <h2 style="text-align: center;">☀️ Welcome to Summer!</h2>
          <p>Dear Sun-Seeker,</p>
          <p>School's out, the sun is shining, and the beach is calling your name! Our Summer Escapes collection features the best destinations to relax, unwind, and soak up the sun.</p>
          <h3>Trending Summer Spots:</h3>
          <ul>
            <li>🏖️ <strong>Ibiza, Spain</strong> — For the ultimate summer parties</li>
            <li>🌴 <strong>Bali, Indonesia</strong> — Tropical paradises and yoga retreats</li>
            <li>🏄 <strong>Gold Coast, Australia</strong> — Surf, sand, and adventure</li>
          </ul>
          <blockquote>Book any family package and kids under 12 fly at <strong>50% off</strong>!</blockquote>
          <p>Pack your sunscreen, we're taking off!</p>
          <p>Cheers,<br/><strong>The Flybeth Team</strong></p>
        `,
        coverImage: '',
      },
      {
        title: 'New Year: Fresh Starts & New Horizons',
        subject: '🎉 Kick off the New Year with a New Adventure!',
        templateCategory: 'seasonal',
        content: `
          <h2 style="text-align: center;">🎉 Happy New Year!</h2>
          <p>Dear Traveler,</p>
          <p>As we welcome the New Year, what better way to start than with a new adventure? Make "travel more" your first resolution that actually sticks.</p>
          <h3>Incredible New Year Fares:</h3>
          <ul>
            <li>🎆 <strong>New York City</strong> — Ring in the year in Times Square</li>
            <li>🏯 <strong>Tokyo, Japan</strong> — Experience a cultural winter wonderland</li>
            <li>🍷 <strong>Cape Town, South Africa</strong> — Summer vibes in January</li>
          </ul>
          <p>We're gifting you a <strong>$100 travel voucher</strong> (Code: NY2026) to help you get started on your bucket list.</p>
          <p>Here's to a year of adventure!<br/><strong>The Flybeth Team</strong></p>
        `,
        coverImage: '',
      }
    ];

    for (const tpl of templates) {
      await this.campaignModel.create({
        ...tpl,
        tenant: new Types.ObjectId(tenantId),
        sender: new Types.ObjectId(senderId),
        createdBy: new Types.ObjectId(senderId),
        status: 'draft',
        isTemplate: true,
        filters: { target: 'all' },
        recipientCount: 0,
      });
    }
    this.logger.log(`Seeded ${templates.length} marketing campaign templates for tenant ${tenantId}`);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledCampaigns() {
    const now = new Date();
    const campaigns = await this.campaignModel.find({
      status: 'queued',
      scheduledAt: { $lte: now }
    }).exec();

    for (const campaign of campaigns) {
      this.sendCampaign(campaign._id.toString()).catch(e => 
        this.logger.error(`Cron campaign ${campaign._id} failed: ${e.message}`)
      );
    }
  }
}
