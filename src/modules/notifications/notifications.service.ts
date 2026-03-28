// src/modules/notifications/notifications.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import {
  Notification,
  NotificationDocument,
} from "./schemas/notification.schema";
import {
  EmailTemplate,
  EmailTemplateDocument,
} from "./schemas/email-template.schema";
import {
  NotificationType,
  NotificationChannel,
} from "../../common/constants/roles.constant";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { paginate } from "../../common/utils/pagination.util";
import { ResendService } from "./resend.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(EmailTemplate.name)
    private templateModel: Model<EmailTemplateDocument>,
    private configService: ConfigService,
    private resendService: ResendService,
  ) {}

  async createNotification(params: {
    userId: string;
    tenantId?: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    channel?: NotificationChannel;
  }): Promise<NotificationDocument> {
    const notification = new this.notificationModel({
      user: new Types.ObjectId(params.userId),
      tenant: params.tenantId ? new Types.ObjectId(params.tenantId) : null,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data,
      channel: params.channel || NotificationChannel.IN_APP,
    });

    return notification.save();
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    variables?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.resendService.sendEmail({ to, subject, html, variables });
    } catch (error) {
      this.logger.error(`Resend email delegation failed: ${error.message}`);
    }
  }

  async sendBookingConfirmation(params: {
    email: string;
    pnr: string;
    firstName: string;
    totalAmount: number;
    currency: string;
    flightDetails: string;
  }): Promise<void> {
    const title = "Booking Confirmed! ✈️";
    const content = `
      <p>Hi ${params.firstName},</p>
      <p>Pack your bags! Your flight booking is confirmed and all set.</p>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">Booking Reference</h3>
        <p style="color: #0D1DAD; font-size: 28px; font-weight: 900; margin: 0 0 20px 0;">${params.pnr}</p>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <p style="margin: 0 0 8px 0; color: #475569;"><strong style="color: #0D1DAD;">Flight:</strong> ${params.flightDetails}</p>
          <p style="margin: 0; color: #475569;"><strong style="color: #0D1DAD;">Total Paid:</strong> ${params.currency} ${params.totalAmount.toLocaleString()}</p>
        </div>
      </div>
      
      <div class="action-area">
        <a href="${this.configService.get("CLIENT_URL")}/bookings/${params.pnr}" class="btn">View My Booking</a>
      </div>
    `;

    await this.sendEmail(
      params.email,
      `Your booking is confirmed: ${params.pnr}`,
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const title = "Welcome aboard, explorer! 🌍";
    const content = `
      <p>Hi ${firstName},</p>
      <p>We're thrilled to have you join our community of global travelers. With Flybeth, we make every journey feel premium and effortless.</p>
      
      <div style="margin: 40px 0;">
        <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid #FF3D00; background: #fffaf0; border-radius: 0 12px 12px 0;">
          <p style="margin: 0; color: #FF3D00; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Exclusive Deals</p>
          <p style="margin: 4px 0 0 0; color: #475569; font-size: 14px;">Access special rates not found anywhere else.</p>
        </div>
        <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid #0D1DAD; background: #eff6ff; border-radius: 0 12px 12px 0;">
          <p style="margin: 0; color: #0D1DAD; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Seamless Booking</p>
          <p style="margin: 4px 0 0 0; color: #475569; font-size: 14px;">Manage all your trips from one simple dashboard.</p>
        </div>
      </div>

      <div class="action-area">
        <a href="${this.configService.get("CLIENT_URL")}/search" class="btn">Start Your Next Adventure</a>
      </div>
    `;
    await this.sendEmail(
      email,
      "Welcome to Flybeth - Your journey begins here",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendOtpEmail(
    email: string,
    firstName: string,
    otp: string,
  ): Promise<void> {
    const title = "Verify Your Identity";
    const content = `
      <p>Hi ${firstName}, use the code below to securely sign in to your Flybeth account.</p>
      
      <div class="otp-card">
        <span class="otp-label">Security Code</span>
        <span class="otp-code">${otp}</span>
      </div>
      
      <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 30px;">
        This code will expire in 10 minutes. If you didn't request this, please ignore this email.
      </p>
    `;
    await this.sendEmail(
      email,
      `${otp} is your Flybeth verification code`,
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendResetPasswordEmail(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const title = "Reset Your Password 🔒";
    const resetUrl = `${this.configService.get("CLIENT_URL")}/auth/reset-password?token=${token}`;
    const content = `
      <p>Hi ${firstName},</p>
      <p>We received a request to reset your password. Click the button below to initialize your new credentials.</p>
      
      <div class="action-area">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>
      
      <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 30px;">
        This link will expire in 1 hour. If you didn't request this, please ignore this email.
      </p>
    `;
    await this.sendEmail(
      email,
      "Password Reset Request - Flybeth",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendAgentWelcomeEmail(email: string, firstName: string): Promise<void> {
    const title = "Welcome to the Flybeth Family 🧡";
    const logoUrl = "http://agent.flybeth.com/_nuxt/logo.CJ2BWGNK.png";
    const content = `
      <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="background-color: #ffffff; max-width: 640px; margin: 0 auto; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(13, 29, 173, 0.05); border: 1px solid #f1f5f9;">
          
          <!-- Header Image & Logo -->
          <div style="background-color: #ffffff; padding: 50px 40px 30px; text-align: center; border-bottom: 1px solid #f1f5f9;">
            <img src="${logoUrl}" alt="Flybeth" style="height: 55px; margin-bottom: 0px; display: inline-block;" />
          </div>

          <div style="padding: 50px 40px; background: #ffffff;">
            
            <h1 style="color: #0D1DAD; font-size: 32px; font-weight: 900; margin: 0 0 30px 0; letter-spacing: -0.5px; text-align: center;">
              A Note from Our Founder 💌
            </h1>

            <p style="font-size: 18px; line-height: 2; color: #334155; margin-top: 0; margin-bottom: 25px;">
              Dearest ${firstName},
            </p>
            
            <p style="font-size: 17px; line-height: 2.1; color: #475569; margin-bottom: 25px;">
              I am absolutely overjoyed to personally welcome you to the Flybeth family! When I first conceptualized this platform, I dreamt of partnering with passionate, dedicated individuals exactly like you. You aren't just an agent to us—you are the beating heart of modern travel, the bridge between explorers and the world.
            </p>
            
            <p style="font-size: 17px; line-height: 2.1; color: #475569; margin-bottom: 40px;">
              We've poured our souls into building an ecosystem that doesn't just work, but feels like sheer magic. The travel industry has been stuck in the past, but together, we are pulling it into a brilliant, seamless future. The value you bring to your clients is extraordinary, and we want to empower you with tools that match your brilliance.
            </p>

            <!-- Magic Awaits You Section -->
            <div style="margin: 50px 0; border: 1px solid #e2e8f0; border-radius: 20px; padding: 40px 30px; background: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.02); position: relative;">
              
              <div style="position: absolute; top: -16px; left: 50%; transform: translateX(-50%); background: #FF3D00; color: #ffffff; padding: 6px 20px; border-radius: 30px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em;">
                ✨ Magic Awaits You
              </div>

              <div style="margin-top: 20px;">
                <!-- Feature 1 -->
                <div style="margin-bottom: 35px;">
                  <h4 style="margin: 0 0 10px 0; color: #0D1DAD; font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">💎</span> Exclusive Wholesale Rates
                  </h4>
                  <p style="margin: 0; font-size: 16px; line-height: 1.8; color: #64748b;">
                    Access heavily negotiated global flights and luxury stays that easily eclipse public markets. Maximizing your margins has never been this effortless.
                  </p>
                </div>

                <!-- Feature 2 -->
                <div style="margin-bottom: 35px;">
                  <h4 style="margin: 0 0 10px 0; color: #0D1DAD; font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">🚀</span> Lightning-fast Booking Wizard
                  </h4>
                  <p style="margin: 0; font-size: 16px; line-height: 1.8; color: #64748b;">
                    The fastest booking flow in the industry. Auto-advancing, predictive, and incredibly intuitive—designed to save you hours every single week.
                  </p>
                </div>

                <!-- Feature 3 -->
                <div style="margin-bottom: 35px;">
                  <h4 style="margin: 0 0 10px 0; color: #0D1DAD; font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">📊</span> Intelligent Analytics Dashboard
                  </h4>
                  <p style="margin: 0; font-size: 16px; line-height: 1.8; color: #64748b;">
                    Real-time reporting, seamless tracking, and automated financial insights right at your fingertips.
                  </p>
                </div>

                <!-- Feature 4 -->
                <div style="margin-bottom: 0;">
                  <h4 style="margin: 0 0 10px 0; color: #0D1DAD; font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">💰</span> Instant Global Payouts
                  </h4>
                  <p style="margin: 0; font-size: 16px; line-height: 1.8; color: #64748b;">
                    Transparent commission structures designed to maximize your profit effortlessly and get you paid faster.
                  </p>
                </div>
              </div>
            </div>

            <!-- What's Next Section (No Button) -->
            <div style="background: #fffaf0; border-left: 5px solid #FF3D00; padding: 30px; border-radius: 0 16px 16px 0; margin-bottom: 50px;">
              <h3 style="margin: 0 0 15px 0; color: #FF3D00; font-size: 18px; font-weight: 800;">
                Our Next Steps
              </h3>
              <p style="margin: 0; font-size: 16px; line-height: 2; color: #475569;">
                Our platform is currently in a highly-exclusive preview phase. Please hold tight! <strong style="color: #0D1DAD;">We are personally reviewing your application and will contact you via email the incredibly exciting second we go live!</strong>
              </p>
            </div>

            <p style="font-size: 17px; line-height: 2.1; color: #475569; margin-bottom: 40px; text-align: center; font-weight: 500;">
              We are about to change the world. Thank you for believing in Flybeth and trusting us with your business. I cannot wait to see you soar.
            </p>

            <div style="text-align: center; margin-top: 50px; padding-top: 40px; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0 0 15px 0; font-family: 'Georgia', serif; font-style: italic; font-size: 22px; color: #0D1DAD;">
                With boundless love and excitement,
              </p>
              <img src="${logoUrl}" alt="Flybeth logo" style="height: 30px; opacity: 0.1; position: absolute; margin-top: 10px; margin-left: 60px;" />
              <p style="margin: 0; font-weight: 900; font-size: 20px; color: #1e293b; letter-spacing: -0.5px;">
                Oluremi Oshinkoya
              </p>
              <p style="margin: 5px 0 0 0; font-size: 15px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
                Founder & CEO, Flybeth
              </p>
            </div>

          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="font-size: 13px; color: #94a3b8; font-weight: 500;">
            © 2026 Flybeth Travel. All rights reserved. Let's elevate every journey together.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail(
      email,
      "A warm welcome from our CEO 💌",
      content
    );
  }

  async sendAbandonedBookingReminder(params: {
    email: string;
    firstName: string;
    itemType: "flight" | "stay";
    itemName: string;
    url: string;
  }): Promise<void> {
    const title = "Don't let this slip away! ⏳";
    const content = `
      <p>Hi ${params.firstName},</p>
      <p>We noticed you left your ${params.itemType} booking for <strong>${params.itemName}</strong> unfinished. Our prices are dynamic and might change soon!</p>
      
      <div style="background: #fff5f5; border: 1px dashed #FF3D00; border-radius: 12px; padding: 20px; margin: 30px 0; text-align: center;">
        <p style="color: #FF3D00; font-weight: 800; margin: 0; font-size: 14px;">We've saved your spot for a limited time.</p>
      </div>
      
      <div class="action-area">
        <a href="${params.url}" class="btn">Complete My Booking</a>
      </div>
    `;
    await this.sendEmail(
      params.email,
      `Did you forget something? Your ${params.itemType} is waiting`,
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendPaymentReceipt(params: {
    email: string;
    firstName: string;
    amount: number;
    currency: string;
    reference: string;
    pnr: string;
  }): Promise<void> {
    const title = "Payment Receipt 💳";
    const content = `
      <p>Dear ${params.firstName},</p>
      <p>Your payment has been processed successfully.</p>
      
      <div style="background: #f8fafc; border-radius: 16px; padding: 30px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Amount Paid</td>
            <td style="padding: 8px 0; text-align: right; color: #0D1DAD; font-weight: 800;">${params.currency} ${params.amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Reference</td>
            <td style="padding: 8px 0; text-align: right; color: #1e293b; font-family: monospace;">${params.reference}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Booking PNR</td>
            <td style="padding: 8px 0; text-align: right; color: #1e293b; font-weight: 600;">${params.pnr}</td>
          </tr>
          <tr style="border-top: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; padding-top: 16px;">Date</td>
            <td style="padding: 8px 0; text-align: right; color: #1e293b; padding-top: 16px;">${new Date().toLocaleDateString()}</td>
          </tr>
        </table>
      </div>
    `;

    await this.sendEmail(
      params.email,
      `Payment Receipt - ${params.reference}`,
      this.resendService.brandWrapper(title, content),
    );
  }

  async getUserNotifications(userId: string, paginationDto: PaginationDto) {
    return paginate(
      this.notificationModel,
      { user: new Types.ObjectId(userId) },
      { ...paginationDto, sortBy: "createdAt", sortOrder: "desc" },
    );
  }

  async markAsRead(id: string): Promise<NotificationDocument | null> {
    return this.notificationModel
      .findByIdAndUpdate(
        id,
        { isRead: true, readAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel
      .updateMany(
        { user: new Types.ObjectId(userId), isRead: false },
        { isRead: true, readAt: new Date() },
      )
      .exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({
        user: new Types.ObjectId(userId),
        isRead: false,
      })
      .exec();
  }

  // --- Email Template Methods ---

  async getTemplates(tenantId?: string): Promise<EmailTemplateDocument[]> {
    const filter: any = {};
    if (tenantId) filter.tenant = new Types.ObjectId(tenantId);
    return this.templateModel.find(filter).sort({ name: 1 }).exec();
  }

  async getTemplateBySlug(
    slug: string,
    tenantId?: string,
  ): Promise<EmailTemplateDocument | null> {
    const filter: any = { slug };
    if (tenantId) filter.tenant = new Types.ObjectId(tenantId);
    return this.templateModel.findOne(filter).exec();
  }

  async getTemplateById(id: string): Promise<EmailTemplateDocument | null> {
    return this.templateModel.findById(id).exec();
  }

  async createTemplate(data: any): Promise<EmailTemplateDocument> {
    const template = new this.templateModel(data);
    return template.save();
  }

  async updateTemplate(
    id: string,
    data: any,
  ): Promise<EmailTemplateDocument | null> {
    return this.templateModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.templateModel.findByIdAndDelete(id).exec();
  }

  /**
   * Replaces {{variable}} placeholders with actual data
   * @deprecated Use this.resendService.replaceVariables instead
   */
  private compileTemplate(html: string, data: Record<string, any>): string {
    return this.resendService.replaceVariables(html, data);
  }

  async sendDynamicEmail(params: {
    slug: string;
    to: string;
    data: Record<string, any>;
    tenantId?: string;
  }): Promise<void> {
    const template = await this.getTemplateBySlug(params.slug, params.tenantId);
    if (!template) {
      this.logger.error(`Email template with slug "${params.slug}" not found`);
      return;
    }

    const htmlContent = this.resendService.replaceVariables(
      template.htmlContent,
      params.data,
    );
    const subject = this.resendService.replaceVariables(
      template.subject,
      params.data,
    );

    // Wrap in branding if not a full HTML document
    const finalHtml = htmlContent.includes("<html")
      ? htmlContent
      : this.resendService.brandWrapper(subject, htmlContent);

    await this.sendEmail(params.to, subject, finalHtml);
  }

  async seedDefaultTemplates(): Promise<void> {
    const defaults = [
      {
        slug: "booking-capture-draft",
        name: "Booking Capture (Initial)",
        subject: "Complete your booking to {{destination}} ✈️",
        htmlContent: `
                <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                    <h1 style="color: #FF3D00;">Hi {{firstName}}! 👋</h1>
                    <p>We've saved your progress for your trip to <strong>{{destination}}</strong>.</p>
                    <p>Prices change fast, so don't wait too long!</p>
                    <div style="margin: 30px 0;">
                        <a href="{{checkoutUrl}}" style="background: #FF3D00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Continue Booking</a>
                    </div>
                    <p style="font-size: 12px; color: #64748b;">If you didn't start this booking, please ignore this email.</p>
                </div>`,
        availableVariables: ["firstName", "destination", "checkoutUrl"],
      },
      {
        slug: "payment-reminder",
        name: "Payment Reminder",
        subject: "Almost there! Complete your payment for {{pnr}}",
        htmlContent: `
                <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                    <h2 style="color: #0f172a;">One last step, {{firstName}}! 💳</h2>
                    <p>Your booking <strong>{{pnr}}</strong> is currently pending payment.</p>
                    <p>Secure your ticket now before the airline releases the seat.</p>
                    <div style="margin: 30px 0;">
                        <a href="{{paymentUrl}}" style="background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Pay Now</a>
                    </div>
                </div>`,
        availableVariables: ["firstName", "pnr", "paymentUrl"],
      },
    ];

    for (const t of defaults) {
      await this.templateModel.findOneAndUpdate({ slug: t.slug }, t, {
        upsert: true,
        new: true,
      });
    }
    this.logger.log("Default email templates seeded");
  }
}
