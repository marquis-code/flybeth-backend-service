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

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.resendService.sendEmail({ to, subject, html });
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
    const html = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #FF3D00 0%, #D32F2F 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Booking Confirmed! ✈️</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #1e293b; line-height: 1.6;">Hi ${params.firstName},</p>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">Pack your bags! Your flight booking is confirmed and all set.</p>
          
          <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 25px; margin: 30px 0;">
            <h3 style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 10px 0;">Booking Reference</h3>
            <p style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 20px 0;">${params.pnr}</p>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <p style="margin: 0 0 8px 0; color: #475569;"><strong style="color: #0f172a;">Flight:</strong> ${params.flightDetails}</p>
              <p style="margin: 0; color: #475569;"><strong style="color: #0f172a;">Total Paid:</strong> ${params.currency} ${params.totalAmount.toLocaleString()}</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${this.configService.get("CLIENT_URL")}/bookings/${params.pnr}" style="background-color: #FF3D00; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View My Booking</a>
          </div>
        </div>
      </div>
    `;

    await this.sendEmail(
      params.email,
      `Your booking is confirmed: ${params.pnr}`,
      html,
    );
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const html = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 60px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.025em;">Welcome to Flybeth! 🌍</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="font-size: 18px; color: #1e293b; font-weight: 600;">Welcome aboard, ${firstName}!</p>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">We're thrilled to have you join our community of global travelers. With Flybeth, we make every journey feel premium and effortless.</p>
          
          <div style="margin: 40px 0;">
            <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid #FF3D00; background: #fffaf0;">
              <p style="margin: 0; color: #9a3412; font-weight: 600;">Exclusive Deals</p>
              <p style="margin: 4px 0 0 0; color: #c2410c; font-size: 14px;">Access special rates not found anywhere else.</p>
            </div>
            <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid #3b82f6; background: #eff6ff;">
              <p style="margin: 0; color: #1d4ed8; font-weight: 600;">Seamless Booking</p>
              <p style="margin: 4px 0 0 0; color: #1e40af; font-size: 14px;">Manage all your trips from one simple dashboard.</p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 40px;">
            <a href="${this.configService.get("CLIENT_URL")}/search" style="background-color: #FF3D00; color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Start Your Next Adventure</a>
          </div>
        </div>
      </div>
    `;
    await this.sendEmail(
      email,
      "Welcome to Flybeth - Your journey begins here",
      html,
    );
  }

  async sendAbandonedBookingReminder(params: {
    email: string;
    firstName: string;
    itemType: "flight" | "stay";
    itemName: string;
    url: string;
  }): Promise<void> {
    const html = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #FF3D00; padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">Don't let this slip away! ⏳</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #1e293b; line-height: 1.6;">Hi ${params.firstName},</p>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">We noticed you left your ${params.itemType} booking for <strong>${params.itemName}</strong> unfinished. Our prices are dynamic and might change soon!</p>
          
          <div style="background: #fff5f5; border: 1px dashed #feb2b2; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
            <p style="color: #c53030; font-weight: 600; margin: 0;">We've saved your spot for a limited time.</p>
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${params.url}" style="background-color: #0f172a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Complete My Booking</a>
          </div>
        </div>
      </div>
    `;
    await this.sendEmail(
      params.email,
      `Did you forget something? Your ${params.itemType} is waiting`,
      html,
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
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Payment Receipt 💳</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <p>Dear ${params.firstName},</p>
          <p>Your payment has been processed successfully.</p>
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Amount:</strong> ${params.currency} ${params.amount.toLocaleString()}</p>
            <p><strong>Reference:</strong> ${params.reference}</p>
            <p><strong>Booking PNR:</strong> ${params.pnr}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    `;

    await this.sendEmail(
      params.email,
      `Payment Receipt - ${params.reference}`,
      html,
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
   */
  private compileTemplate(html: string, data: Record<string, any>): string {
    return html.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      const value = data[key.trim()];
      return value !== undefined ? value : match;
    });
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

    const html = this.compileTemplate(template.htmlContent, params.data);
    const subject = this.compileTemplate(template.subject, params.data);

    await this.sendEmail(params.to, subject, html);
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
