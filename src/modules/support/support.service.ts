import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NewsletterSubscription, NewsletterSubscriptionDocument } from './schemas/newsletter.schema';
import { ContactInquiry, ContactInquiryDocument } from './schemas/inquiry.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { ResendService } from '../notifications/resend.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectModel(NewsletterSubscription.name) private newsletterModel: Model<NewsletterSubscriptionDocument>,
    @InjectModel(ContactInquiry.name) private inquiryModel: Model<ContactInquiryDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly resendService: ResendService,
  ) {}

  private async getTenantContext(tenantId?: string): Promise<Types.ObjectId> {
    if (tenantId && Types.ObjectId.isValid(tenantId)) {
      return new Types.ObjectId(tenantId);
    }
    
    // Fallback to platform tenant
    const platform = await this.tenantModel.findOne({ slug: 'flybeth' }).exec();
    if (platform) return platform._id;
    
    // If absolutely no tenant found, return a stable random-like but fixed ID if we must, 
    // but better to throw or handle. For now, since we seeded 'flybeth', it should work.
    return new Types.ObjectId('000000000000000000000000');
  }

  async subscribeNewsletter(tenantId: string, email: string, source?: string): Promise<NewsletterSubscriptionDocument> {
    const tid = await this.getTenantContext(tenantId);
    const existing = await this.newsletterModel.findOne({ email, tenant: tid }).exec();
    
    if (existing) {
      if (existing.status === 'active') {
        throw new ConflictException('You are already subscribed to our newsletter.');
      }
      existing.status = 'active';
      return existing.save();
    }

    const subscription = new this.newsletterModel({
      email,
      tenant: tid,
      source,
      status: 'active'
    });

    const saved = await subscription.save();

    // Send Welcome Email
    const title = 'Welcome to the Inner Circle';
    const content = `
      <p>Hello explorer,</p>
      <p>Thank you for joining the <strong>Flybeth newsletter!</strong> You're now officially part of an exclusive group of travelers who get early access to our most prestigious deals and curated travel insights.</p>
      <p>Here's what you can expect from us:</p>
      <ul>
        <li>🔥 <strong>First dibs</strong> on seasonal flash sales and error fares</li>
        <li>✨ <strong>Expert guides</strong> to the world's most luxurious hidden gems</li>
        <li>🎁 <strong>Member-only rewards</strong> and partner perks</li>
      </ul>
      <div style="text-align: center; margin: 40px 0;">
        <a href="https://flybeth.com/explore" style="display: inline-block; padding: 18px 36px; background: #0f172a; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700;">Start Exploring</a>
      </div>
      <p>We're thrilled to have you with us. Stay tuned for your first update!</p>
      <p>Elevating every journey,<br/><strong>The Flybeth Team</strong></p>
    `;

    const html = this.resendService.brandWrapper(title, content);
    
    try {
      await this.notificationsService.sendEmail(email, 'Welcome to Flybeth! 🌍 Your journey starts here.', html);
    } catch (err) {
      this.logger.error(`Failed to send newsletter welcome email to ${email}: ${err.message}`);
    }

    return saved;
  }

  async submitInquiry(tenantId: string, data: any): Promise<ContactInquiryDocument> {
    const tid = await this.getTenantContext(tenantId);
    const inquiry = new this.inquiryModel({
      ...data,
      tenant: tid,
      status: 'new'
    });

    const saved = await inquiry.save();

    // Send Acknowledgement Email
    const title = 'We\'ve Received Your Message';
    const content = `
      <p>Dear ${data.name},</p>
      <p>Thank you for reaching out to **Flybeth Support.** This is a confirmation that we've received your inquiry regarding <strong>"${data.subject}"</strong>.</p>
      <p>Our concierge team is currently reviewing your message and will provide a personalized response within the next 24 business hours.</p>
      <div style="background: #f8fafc; padding: 25px; border-radius: 20px; border: 1px solid #f1f5f9; margin: 30px 0;">
        <p style="margin: 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8;">Reference Ticket</p>
        <p style="margin: 5px 0 0; font-size: 20px; font-weight: 800; color: #0f172a;">#${saved._id.toString().slice(-6).toUpperCase()}</p>
      </div>
      <p>If your matter is urgent, please feel free to call our priority line at <strong>+1 (800) FLY-BETH</strong>.</p>
      <p>Safe travels,<br/><strong>The Flybeth Concierge Team</strong></p>
    `;

    const html = this.resendService.brandWrapper(title, content);
    
    try {
      await this.notificationsService.sendEmail(data.email, `Inquiry Received: ${data.subject}`, html);
    } catch (err) {
      this.logger.error(`Failed to send inquiry acknowledgment to ${data.email}: ${err.message}`);
    }

    return saved;
  }

  // Admin Methods
  async getInquiries(tenantId: string, query: any = {}): Promise<any> {
    const filter: any = { ...query };
    if (tenantId && Types.ObjectId.isValid(tenantId)) {
      filter.tenant = new Types.ObjectId(tenantId);
    }
    return this.inquiryModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async getSubscriptions(tenantId: string, query: any = {}): Promise<any> {
    const filter: any = { ...query };
    if (tenantId && Types.ObjectId.isValid(tenantId)) {
      filter.tenant = new Types.ObjectId(tenantId);
    }
    return this.newsletterModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async updateInquiry(id: string, tenantId: string, status: string): Promise<ContactInquiryDocument> {
    const inquiry = await this.inquiryModel.findOneAndUpdate(
      { _id: id, tenant: new Types.ObjectId(tenantId) },
      { status },
      { new: true }
    ).exec();
    if (!inquiry) throw new NotFoundException('Inquiry not found');
    return inquiry;
  }
}
