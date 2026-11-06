// src/modules/notifications/notifications.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
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

import {
  renderAbandonedBooking,
  renderAgentApproval,
  renderAgentSignupUnderReview,
  renderAgentWelcome,
  renderBookingConfirmation,
  renderInvitationReminder,
  renderKycApproval,
  renderKycRejection,
  renderOtp,
  renderPasswordReset,
  renderPaymentReceipt,
  renderPaymentReminder,
  renderBookingCaptureDraft,
  renderBookingVoucher,
  renderRoleUpdate,
  renderTeamInvitation,
  renderWelcome,
} from "./email/templates";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { paginate } from "../../common/utils/pagination.util";
import { ResendService } from "./resend.service";
import { forwardRef, Inject } from "@nestjs/common";
import { ChatGateway } from "../chat/chat.gateway";
import { NotificationsGateway } from "./notifications.gateway";
import { SystemConfigService } from "../system-config/system-config.service";

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
    private systemConfigService: SystemConfigService,
    @InjectQueue("email-queue") private emailQueue: Queue,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    private readonly notificationsGateway: NotificationsGateway,
  ) { }

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

    const saved = await notification.save();

    // Broadcast to user in real-time
    this.chatGateway.sendNotificationToUser(params.userId, saved);

    return saved;
  }

  // --- Real-Time Admin Notifications ---

  emitBookingAttempt(data: any) {
    this.notificationsGateway.emitToAdmins('booking_attempt', {
      message: 'A user is attempting to create a booking.',
      data,
      timestamp: new Date(),
    });
  }

  emitBookingSuccess(data: any) {
    this.notificationsGateway.emitToAdmins('booking_success', {
      message: 'A booking was successfully completed.',
      data,
      timestamp: new Date(),
    });
  }

  emitBookingFailed(data: any) {
    this.notificationsGateway.emitToAdmins('booking_failed', {
      message: 'A booking or payment attempt failed.',
      data,
      timestamp: new Date(),
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    variables?: Record<string, any>,
    attachments?: Array<{ filename: string; content: Buffer }>,
  ): Promise<void> {
    try {
      await this.emailQueue.add(
        "send-email",
        {
          to,
          subject,
          html,
          variables,
          attachments,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: true,
        },
      );
      this.logger.log(`Email job added to queue for: ${to}`);
    } catch (error) {
      this.logger.error(`Failed to add email to queue: ${error.message}`);
    }
  }

  async sendBookingConfirmation(params: {
    email: string;
    booking: any;
    attachments?: any[];
  }): Promise<void> {
    const { booking } = params;

    // Payment instructions are only relevant when the booking is on hold for a
    // bank transfer, so resolve the matching account here and let the template
    // decide how to present it.
    let bankAccount: any = undefined;
    const needsTransfer =
      booking?.paymentMethod === 'manual' ||
      booking?.paymentMethod === 'transfer' ||
      booking?.paymentStatus === 'pending';

    if (needsTransfer) {
      try {
        const config = await this.systemConfigService.getConfig();
        const currency = booking?.pricing?.currency || 'USD';
        bankAccount =
          config?.bankAccounts?.find((acc: any) => acc.currency === currency) ||
          config?.bankAccounts?.[0];
      } catch (error) {
        this.logger.warn(`Could not load bank details for ${booking?.pnr}: ${error.message}`);
      }
    }

    const html = renderBookingConfirmation(booking, {
      bankAccount,
      clientUrl: this.configService.get('CLIENT_URL') || 'https://flybeth.com',
    });

    const destination =
      html.match(/You're going to ([^<]+)/)?.[1]?.trim() ||
      booking?.flights?.[0]?.metadata?.destination ||
      'your trip';

    const subject = needsTransfer
      ? `Booking ${booking?.pnr} — complete your payment`
      : `Your e-ticket is ready — ${destination} (${booking?.pnr})`;

    await this.sendEmail(
      params.email,
      subject,
      html,
      undefined,
      params.attachments,
    );
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const template = await this.getTemplateBySlug('welcome-email');
    if (template && template.isActive) {
      await this.sendDynamicEmail({
        slug: 'welcome-email',
        to: email,
        data: { firstName },
      });
      return;
    }

    const loginUrl = `${this.configService.get('CLIENT_URL') || 'https://flybeth.com'}/auth/login`;
    await this.sendEmail(
      email,
      `Welcome to Flybeth, ${firstName || 'traveller'}`,
      renderWelcome(firstName, loginUrl),
    );
  }

  async sendOtpEmail(
    email: string,
    firstName: string,
    otp: string,
  ): Promise<void> {
    const template = await this.getTemplateBySlug('otp-email');
    if (template && template.isActive) {
      await this.sendDynamicEmail({
        slug: 'otp-email',
        to: email,
        data: { firstName, otp },
      });
      return;
    }

    await this.sendEmail(
      email,
      `Your Flybeth verification code: ${otp}`,
      renderOtp(firstName, otp),
    );
  }

  async sendResetPasswordEmail(
    email: string,
    firstName: string,
    token: string,
    isAdmin: boolean = false,
  ): Promise<void> {
    // Choose the correct base URL and path based on role
    let resetUrl = '';
    if (isAdmin) {
      const adminBaseUrl = this.configService.get('ADMIN_URL') || 'http://localhost:3001';
      resetUrl = `${adminBaseUrl}/reset-password?token=${token}`;
    } else {
      const clientBaseUrl = this.configService.get('CLIENT_URL') || 'https://flybeth.com';
      resetUrl = `${clientBaseUrl}/auth/reset-password?token=${token}`;
    }

    const template = await this.getTemplateBySlug('reset-password');
    if (template && template.isActive) {
      await this.sendDynamicEmail({
        slug: 'reset-password',
        to: email,
        data: { firstName, resetUrl, token, isAdmin },
      });
      return;
    }

    await this.sendEmail(
      email,
      'Reset your Flybeth password',
      renderPasswordReset(firstName, resetUrl, isAdmin),
    );
  }

  async sendAgentWelcomeEmail(email: string, firstName: string): Promise<void> {
    const loginUrl = `${this.configService.get('AGENT_URL') || 'https://agent.flybeth.com'}/auth/login`;
    await this.sendEmail(
      email,
      `Welcome to the Flybeth agent network, ${firstName || 'partner'}`,
      renderAgentWelcome(firstName, loginUrl),
    );
  }

  async sendAgentSignupUnderReviewEmail(
    email: string,
    firstName: string,
  ): Promise<void> {
    await this.sendEmail(
      email,
      'Your Flybeth agent application is in review',
      renderAgentSignupUnderReview(firstName),
    );
  }

  async sendKycDocumentApprovalEmail(
    email: string,
    firstName: string,
    documentType: string,
  ): Promise<void> {
    await this.sendEmail(
      email,
      `Verified: ${documentType} approved`,
      renderKycApproval(firstName, documentType),
    );
  }

  async sendKycDocumentRejectionEmail(
    email: string,
    firstName: string,
    documentType: string,
    feedback: string,
  ): Promise<void> {
    await this.sendEmail(
      email,
      `Action required: we could not verify your ${documentType}`,
      renderKycRejection(firstName, documentType, feedback),
    );
  }

  async sendAgentApprovalEmail(
    email: string,
    firstName: string,
  ): Promise<void> {
    const loginUrl = `${this.configService.get('AGENT_URL') || 'https://agent.flybeth.com'}/auth/login`;
    await this.sendEmail(
      email,
      'Your Flybeth agent account is approved',
      renderAgentApproval(firstName, loginUrl),
    );
  }

  async sendTeamInvitationEmail(
    email: string,
    role: string,
    inviteUrl: string,
    expiresAt: string,
    permissions: string[] = [],
  ): Promise<void> {
    await this.sendEmail(
      email,
      `You have been invited to join Flybeth as ${role}`,
      renderTeamInvitation(role, inviteUrl, expiresAt, permissions),
    );
  }

  async sendRoleUpdateEmail(
    email: string,
    roleName: string,
    permissions: string[] = [],
  ): Promise<void> {
    await this.sendEmail(
      email,
      `Your Flybeth role is now ${roleName}`,
      renderRoleUpdate(roleName, permissions),
    );
  }

  async sendInvitationReminderEmail(
    email: string,
    inviteUrl: string,
  ): Promise<void> {
    await this.sendEmail(
      email,
      'Reminder: your Flybeth invitation expires soon',
      renderInvitationReminder(inviteUrl),
    );
  }

  async sendAbandonedBookingReminder(params: {
    email: string;
    firstName: string;
    itemType: "flight" | "stay";
    itemName: string;
    url: string;
  }): Promise<void> {
    await this.sendEmail(
      params.email,
      `Still thinking about ${params.itemName}?`,
      renderAbandonedBooking({
        firstName: params.firstName,
        itemType: params.itemType,
        itemName: params.itemName,
        url: params.url,
      }),
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
    await this.sendEmail(
      params.email,
      `Payment received — ${params.currency} ${Number(params.amount).toFixed(2)} for ${params.pnr}`,
      renderPaymentReceipt(params),
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
    attachments?: any[];
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

    await this.sendEmail(params.to, subject, finalHtml, {}, params.attachments);
  }

    /**
     * Seeds/refreshes the database-stored templates.
     *
     * The HTML comes from the same renderers as the hard-coded emails, with
     * `{{variable}}` placeholders passed in as literal values so the existing
     * substitution pipeline still works.
     */
    async seedDefaultTemplates(): Promise<void> {
      const defaults = [
        {
          slug: "booking-capture-draft",
          name: "Flight Booking Capture",
          subject: "Finish your flight to {{destination}}",
          htmlContent: renderBookingCaptureDraft(
            "{{destination}}",
            "{{firstName}}",
            "{{checkoutUrl}}",
          ),
          availableVariables: ["firstName", "destination", "checkoutUrl"],
        },
        {
          slug: "payment-reminder",
          name: "Payment Reminder",
          subject: "Secure your ticket for {{pnr}}",
          htmlContent: renderPaymentReminder(
            "{{firstName}}",
            "{{pnr}}",
            "{{paymentUrl}}",
          ),
          availableVariables: ["firstName", "pnr", "paymentUrl"],
        },
        {
          slug: "welcome-email",
          name: "Welcome to Flybeth",
          subject: "Welcome to Flybeth, {{firstName}}",
          htmlContent: renderWelcome("{{firstName}}", "{{loginUrl}}"),
          availableVariables: ["firstName", "loginUrl"],
        },
        {
          slug: "otp-email",
          name: "Verification Code",
          subject: "Your Flybeth verification code: {{otp}}",
          htmlContent: renderOtp("{{firstName}}", "{{otp}}"),
          availableVariables: ["firstName", "otp"],
        },
        {
          slug: "reset-password",
          name: "Password Reset",
          subject: "Reset your Flybeth password",
          htmlContent: renderPasswordReset("{{firstName}}", "{{resetUrl}}"),
          availableVariables: ["firstName", "resetUrl"],
        },
        {
          slug: "password-reset",
          name: "Password Reset (legacy alias)",
          subject: "Reset your Flybeth password",
          htmlContent: renderPasswordReset("{{firstName}}", "{{resetUrl}}"),
          availableVariables: ["firstName", "resetUrl"],
        },
        {
          slug: "booking-confirmation",
          name: "E-Ticket & Booking Confirmation",
          subject: "Your e-ticket for {{destination}} is ready",
          htmlContent: renderBookingVoucher({
            firstName: "{{firstName}}",
            destination: "{{destination}}",
            pnr: "{{pnr}}",
            currency: "{{currency}}",
            amount: "{{amount}}",
            manageUrl: "{{manageUrl}}",
          }),
          availableVariables: [
            "firstName",
            "lastName",
            "destination",
            "pnr",
            "currency",
            "amount",
            "manageUrl",
          ],
        },
      ];

      for (const t of defaults) {
        await this.templateModel.findOneAndUpdate({ slug: t.slug }, t, {
          upsert: true,
          new: true,
        });
      }
      this.logger.log(`Default email templates seeded (${defaults.length})`);
    }
}
