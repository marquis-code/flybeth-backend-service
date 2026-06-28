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
import { PaginationDto } from "../../common/dto/pagination.dto";
import { paginate } from "../../common/utils/pagination.util";
import { ResendService } from "./resend.service";
import { forwardRef, Inject } from "@nestjs/common";
import { ChatGateway } from "../chat/chat.gateway";
import { NotificationsGateway } from "./notifications.gateway";

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
    pnr: string;
    firstName: string;
    totalAmount: number;
    currency: string;
    flightDetails: string;
  }): Promise<void> {
    const template = await this.getTemplateBySlug('booking-confirmation');
    if (template && template.isActive) {
      await this.sendDynamicEmail({
        slug: 'booking-confirmation',
        to: params.email,
        data: {
          firstName: params.firstName,
          pnr: params.pnr,
          totalAmount: params.totalAmount,
          currency: params.currency,
          flightDetails: params.flightDetails
        }
      });
      return;
    }

    const title = "Your Journey is Confirmed!";
    const content = `
      <p>Hi <strong>${params.firstName}</strong>,</p>
      <p>Your flight booking has been successfully processed and ticketed.</p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Booking Reference (PNR)</p>
        <p style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 24px 0;">${params.pnr}</p>
        <div style="margin-bottom: 16px;">
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Flight Route Overview</p>
          <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">${params.flightDetails}</p>
        </div>
        <div>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Total Paid</p>
          <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 700;">${params.currency} ${params.totalAmount.toLocaleString()}</p>
        </div>
      </div>
      <div class="action-area">
        <a href="${this.configService.get("CLIENT_URL")}/bookings/${params.pnr}" class="btn">View Boarding Pass</a>
      </div>
      <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">Please verify all passport requirements for your destination. We recommend arriving at the airport at least 3 hours prior to international departures.</p>
    `;

    await this.sendEmail(
      params.email,
      `Booking Confirmed: ${params.pnr} - Flybeth`,
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const template = await this.getTemplateBySlug('welcome-email');
    if (template && template.isActive) {
      await this.sendDynamicEmail({
        slug: 'welcome-email',
        to: email,
        data: { firstName }
      });
      return;
    }

    const title = "Welcome to Flybeth!";
    const content = `
      <p>Hi ${firstName},</p>
      <p>We're delighted to welcome you to the Flybeth family! Our mission is to make every journey feel effortless and premium.</p>
      <div style="margin: 24px 0; background-color: #f9fafb; border-radius: 8px; padding: 24px; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; font-weight: 600;">Elite Inventory</p>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: #4b5563;">Unlock global rates for flights and luxury accommodation seamlessly synced to your account.</p>
        <p style="margin: 0 0 8px 0; font-weight: 600;">Seamless Design</p>
        <p style="margin: 0; font-size: 13px; color: #4b5563;">Manage your entire travel ecosystem from a minimalist dashboard customized just for you.</p>
      </div>
      <div class="action-area">
        <a href="${this.configService.get("CLIENT_URL")}/search" class="btn">Discover Destinations</a>
      </div>
    `;
    await this.sendEmail(
      email,
      "Welcome to Flybeth",
      this.resendService.brandWrapper(title, content),
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
        data: { firstName, otp }
      });
      return;
    }

    const title = "Security Verification Code";
    const content = `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>To secure your digital session, please use the following one-time password (OTP) to complete your authentication to Flybeth.</p>
      
      <div style="background: #f9fafb; padding: 32px 24px; text-align: center; border-radius: 8px; border: 1px dashed #d1d5db; margin: 24px 0;">
        <span style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 12px;">Verification Code</span>
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 4px; color: #111827;">${otp}</span>
      </div>
      
      <p style="font-size: 12px; color: #6b7280; margin-top: 16px;">This code expires in 10 minutes. Never share this PIN with anyone.</p>
    `;
    await this.sendEmail(
      email,
      `${otp} is your secure Flybeth sign-in code`,
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendResetPasswordEmail(
    email: string,
    firstName: string,
    token: string,
    isAdmin: boolean = false,
  ): Promise<void> {
    // Choose correct base URL and path based on role
    let resetUrl = "";
    if (isAdmin) {
      const adminBaseUrl = this.configService.get("ADMIN_URL") || "http://localhost:3001";
      resetUrl = `${adminBaseUrl}/reset-password?token=${token}`;
    } else {
      const clientBaseUrl = this.configService.get("CLIENT_URL") || "http://localhost:4000";
      resetUrl = `${clientBaseUrl}/auth/reset-password?token=${token}`;
    }

    const template = await this.getTemplateBySlug('reset-password');
    if (template && template.isActive) {
      await this.sendDynamicEmail({
        slug: 'reset-password',
        to: email,
        data: { firstName, resetUrl, token, isAdmin }
      });
      return;
    }

    const title = "Reset Your Password";
    const content = `
      <p>Hi ${firstName},</p>
      <p>We received a request to reset the password for your Flybeth account. To proceed with setting a new credential, please click the secure link below.</p>
      
      <div class="action-area">
        <a href="${resetUrl}" class="btn">Reset My Password</a>
      </div>
      
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 24px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #4b5563;">Trouble with the button?</p>
        <p style="margin: 0; font-size: 12px; color: #0D1DAD; word-break: break-all;">${resetUrl}</p>
      </div>

      <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">If you did not request this, please ignore this message. Your account remains protected.</p>
    `;
    await this.sendEmail(
      email,
      "Password Reset Instructions - Flybeth",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendAgentWelcomeEmail(email: string, firstName: string): Promise<void> {
    const title = "Welcome to the Flybeth Global Network";
    const content = `
      <p>Dearest <strong>${firstName}</strong>,</p>
      <p>I am thrilled to personally welcome your agency to the Flybeth Global Network. You are the bridge between explorers and the world, and we are here to amplify your brilliance.</p>
      <p>Our ecosystem is built for speed, precision, and profit. We recognize the immense value you bring, and we've built the tools to match it.</p>
      
      <div style="margin: 32px 0; background: #f9fafb; border-radius: 8px; padding: 24px; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 16px 0; font-weight: 600; font-size: 14px; text-transform: uppercase; color: #4b5563;">Commercial Advantage</p>
        <p style="margin: 0 0 4px 0; font-weight: 600; font-size: 14px;">Wholesale GDS Routing</p>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: #4b5563;">Access institutional flight APIs with automated mark-up logic and negotiated global airfares.</p>
        <p style="margin: 0 0 4px 0; font-weight: 600; font-size: 14px;">Automated Clearing</p>
        <p style="margin: 0; font-size: 13px; color: #4b5563;">Transparent commission structures with direct settlement to your verified payout institution.</p>
      </div>

      <div style="margin-top: 32px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;">With boundless love and excitement,</p>
        <p style="margin: 0; font-weight: 600; color: #111827;">Oluremi Oshinkoya</p>
        <p style="margin: 0; font-size: 12px; color: #6b7280;">Founder & CEO, Flybeth</p>
      </div>
    `;

    await this.sendEmail(email, "A formal B2B welcome from our CEO", this.resendService.brandWrapper(title, content));
  }

  async sendAgentSignupUnderReviewEmail(
    email: string,
    firstName: string,
  ): Promise<void> {
    const title = "Application Under Review";
    const content = `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Thank you for registering your agency. We have successfully secured your onboarding pipeline data and compliance documents.</p>
      
      <div style="background: #f9fafb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0; border-top: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
        <p style="color: #b45309; font-weight: 600; font-size: 12px; text-transform: uppercase; margin: 0 0 8px 0;">Internal Compliance Queue</p>
        <p style="margin: 0; color: #4b5563; font-size: 13px;">Our global compliance team is reviewing your documentation. This typically takes 24-48 hours. We will notify you once cleared for commercial operations.</p>
      </div>

      <div class="action-area">
        <a href="http://agent.flybeth.com/auth/login" class="btn">Track Application Status</a>
      </div>
    `;
    await this.sendEmail(
      email,
      "Your Flybeth B2B Profile is Under Review",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendKycDocumentApprovalEmail(
    email: string,
    firstName: string,
    documentType: string,
  ): Promise<void> {
    const title = "Compliance Verified";
    const content = `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Excellent progression! Our compliance division has successfully authenticated and approved your <strong>${documentType}</strong>.</p>
      
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; color: #166534; font-size: 13px;">Your identity documents have been cleared and securely stored. This moves you closer to unrestricted transactional capabilities.</p>
      </div>
    `;
    await this.sendEmail(
      email,
      `Verified: ${documentType} cleared by compliance`,
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendKycDocumentRejectionEmail(
    email: string,
    firstName: string,
    documentType: string,
    feedback: string,
  ): Promise<void> {
    const title = "Document Flagged";
    const content = `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>During a routine sweep, our compliance system flagged your submitted <strong>${documentType}</strong>. To proceed, we require a rapid correction.</p>
      
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="color: #b91c1c; margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; font-weight: 600;">Assessor Feedback</p>
        <p style="margin: 0; color: #7f1d1d; font-size: 14px; font-weight: 500;">"${feedback}"</p>
      </div>

      <div class="action-area">
        <a href="http://agent.flybeth.com/kyc" class="btn" style="background: #b91c1c;">Submit Correction</a>
      </div>
    `;
    await this.sendEmail(
      email,
      `Action Required: Failed verification on ${documentType}`,
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendAgentApprovalEmail(
    email: string,
    firstName: string,
  ): Promise<void> {
    const title = "Deployment Authorized";
    const content = `
      <p>Congratulations <strong>${firstName}</strong>!</p>
      <p>Your partnership application has been rigorously analyzed and passed. <strong>Your agency is now live!</strong></p>
      
      <div style="background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="color: #4b5563; font-weight: 600; margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase;">Secure Access Key</p>
        <p style="color: #111827; font-weight: 600; font-size: 16px; margin: 0 0 8px 0;">${email}</p>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">Access initialized with your registered security credentials.</p>
      </div>
      
      <div class="action-area">
        <a href="http://agent.flybeth.com/auth/login" class="btn">Initialize Dashboard</a>
      </div>
    `;
    await this.sendEmail(
      email,
      "You are live! Full B2B platform unlocked.",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendTeamInvitationEmail(
    email: string,
    role: string,
    inviteUrl: string,
    expiresAt: string,
    permissions: string[] = [],
  ): Promise<void> {
    const title = "Welcome to the Flybeth Team";
    
    let permissionsHtml = "";
    if (permissions && permissions.length > 0) {
      permissionsHtml = `
        <p style="color: #4b5563; font-size: 13px; margin-top: 16px; margin-bottom: 8px;">Granted Permissions:</p>
        <ul style="color: #4b5563; font-size: 13px; padding-left: 20px; margin-bottom: 0; margin-top: 0;">
          ${permissions.map(p => `<li>${p.replace(/_/g, ' ')}</li>`).join('')}
        </ul>
      `;
    }

    const content = `
      <p>Congratulations!</p>
      <p>You have been invited to join the <strong>Flybeth Administrative Team</strong>. We are excited to bring you on board to help manage and scale our global travel operations.</p>
      
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="color: #4b5563; font-weight: 600; margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase;">Invitation Details</p>
        <p style="color: #111827; font-weight: 500; font-size: 14px; margin: 0 0 4px 0;">Assigned Access Level: <span style="text-transform: capitalize;">${role.replace('_', ' ')}</span></p>
        <p style="color: #b91c1c; font-size: 12px; margin: 0;">Expires on ${expiresAt}</p>
        ${permissionsHtml}
      </div>
      
      <div class="action-area">
        <a href="${inviteUrl}" class="btn">Accept Invitation</a>
      </div>
      <p style="font-size: 12px; color: #6b7280; margin-top: 16px;">If you're having trouble clicking the button, copy and paste this link: <br/><br/><code style="word-break: break-all;">${inviteUrl}</code></p>
    `;
    await this.sendEmail(
      email,
      "You've been invited to join the Flybeth Admin Team",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendRoleUpdateEmail(
    email: string,
    roleName: string,
    permissions: string[],
  ): Promise<void> {
    const title = "Permissions Updated";
    
    let permissionsHtml = "";
    if (permissions && permissions.length > 0) {
      permissionsHtml = `
        <ul style="color: #4b5563; font-size: 13px; padding-left: 20px; margin-bottom: 0; margin-top: 0;">
          ${permissions.map(p => `<li>${p.replace(/_/g, ' ')}</li>`).join('')}
        </ul>
      `;
    } else {
      permissionsHtml = `<p style="color: #4b5563; font-size: 13px; margin: 0;">Your role currently has no active permissions.</p>`;
    }

    const content = `
      <p>Your access permissions for the role <strong>${roleName.replace(/_/g, ' ')}</strong> have been updated by an administrator.</p>
      
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="color: #4b5563; font-weight: 600; margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase;">Current Permissions</p>
        ${permissionsHtml}
      </div>
      
      <div class="action-area">
        <a href="http://admin.flybeth.com/login" class="btn">Login to Dashboard</a>
      </div>
    `;
    
    await this.sendEmail(
      email,
      "Your Flybeth Permissions have been updated",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendInvitationReminderEmail(
    email: string,
    inviteUrl: string,
  ): Promise<void> {
    const title = "Your Invitation is Expiring Soon!";
    const content = `
      <p>Action Required</p>
      <p>This is a quick reminder that your invitation to join the <strong>Flybeth Administrative Team</strong> will expire soon.</p>
      <p>Please click the secure link below to accept the invitation and set up your administrative credentials before it expires.</p>
      
      <div class="action-area">
        <a href="${inviteUrl}" class="btn" style="background: #b91c1c;">Accept Invitation Now</a>
      </div>
    `;
    await this.sendEmail(
      email,
      "Action Required: Your Flybeth Team Invitation is expiring soon",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendAbandonedBookingReminder(params: {
    email: string;
    firstName: string;
    itemType: "flight" | "stay";
    itemName: string;
    url: string;
  }): Promise<void> {
    const title = "Incomplete Journey";
    const content = `
      <p>Hi <strong>${params.firstName}</strong>,</p>
      <p>Our engine noticed you paused your selection for <strong>${params.itemName}</strong>. Don't let your perfect trip slip away.</p>
      
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="color: #b45309; font-weight: 600; margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase;">Dynamic Pricing Alert</p>
        <p style="color: #92400e; font-size: 13px; margin: 0;">We've temporarily locked this rate for you. Secure it now before it resets.</p>
      </div>
      
      <div class="action-area">
        <a href="${params.url}" class="btn">Resume My Booking</a>
      </div>
    `;
    await this.sendEmail(
      params.email,
      `Action Needed: Finalize your ${params.itemType} before pricing resets`,
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
    const title = "Payment Successful";
    const content = `
      <p>Dear <strong>${params.firstName}</strong>,</p>
      <p>We have securely cleared your payment request. Your transaction details are recorded below for your records.</p>
      
      <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #4b5563; font-weight: 500;">Authorized Amount</td>
            <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 700;">${params.currency} ${params.amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4b5563; font-weight: 500;">Transaction Ref</td>
            <td style="padding: 8px 0; text-align: right; color: #111827; font-family: monospace;">${params.reference}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4b5563; font-weight: 500;">Booking ID (PNR)</td>
            <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 600;">${params.pnr}</td>
          </tr>
          <tr style="border-top: 1px dashed #d1d5db;">
            <td style="padding: 16px 0 0; color: #4b5563; font-weight: 500;">Timestamp</td>
            <td style="padding: 16px 0 0; text-align: right; color: #111827;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
      </div>
    `;

    await this.sendEmail(
      params.email,
      `Payment Receipt Confirmed - ${params.reference}`,
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
    const baseStyle = `body { margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, sans-serif; }
    .email-wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center; color: #333333; }
    .logo { margin-bottom: 30px; font-weight: bold; font-size: 20px; color: #111827; }
    .title { font-size: 18px; font-weight: 600; margin-bottom: 10px; color: #111827; }
    .text { font-size: 14px; line-height: 1.5; color: #4b5563; margin-bottom: 20px; text-align: left; }
    .btn { display: inline-block; background-color: #111827; color: #ffffff !important; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-size: 14px; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
    .footer a { color: #111827; text-decoration: none; font-weight: 500; }
    .box { background: #f9fafb; padding: 20px; border-radius: 6px; text-align: left; margin-bottom: 20px; }
    .box p { margin: 0 0 10px 0; font-size: 14px; }
    .box p:last-child { margin: 0; }`;

    const getHtml = (innerContent) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><style>${baseStyle}</style></head>
<body>
  <div class="email-wrapper">
    <div class="logo">Flybeth</div>
    ${innerContent}
    <div class="footer">
      <p>Looking for your next adventure?</p>
      <a href="${this.configService.get("CLIENT_URL") || 'https://flybeth.com'}">Visit Flybeth to perform other bookings</a>
    </div>
  </div>
</body>
</html>`;

    const defaults = [
      {
        slug: "booking-capture-draft",
        name: "Flight Booking Capture",
        subject: "Finish your flight to {{destination}}",
        htmlContent: getHtml(`
          <div class="title">Finish your flight to {{destination}}</div>
          <p class="text">Seats and prices don't stick around for long. If you still want this trip, now's a good time to lock it in.</p>
          <div class="box">
            <p><strong>Passenger:</strong> {{firstName}}</p>
            <p><strong>Destination:</strong> {{destination}}</p>
          </div>
          <a href="{{checkoutUrl}}" class="btn">Complete your booking</a>
        `),
        availableVariables: ["firstName", "destination", "checkoutUrl"],
      },
      {
        slug: "payment-reminder",
        name: "Payment Reminder",
        subject: "Secure your ticket for {{pnr}}",
        htmlContent: getHtml(`
          <div class="title">Action Required, {{firstName}}</div>
          <p class="text">Your booking is currently pending final settlement. Please complete your payment to secure your seat and current price.</p>
          <div class="box">
            <p><strong>Booking Reference:</strong> {{pnr}}</p>
          </div>
          <a href="{{paymentUrl}}" class="btn">Secure Ticket Now</a>
        `),
        availableVariables: ["firstName", "pnr", "paymentUrl"],
      },
      {
        slug: "welcome-email",
        name: "Welcome to Flybeth",
        subject: "Welcome to Flybeth, {{firstName}}",
        htmlContent: getHtml(`
          <div class="title">Welcome aboard, {{firstName}}!</div>
          <p class="text">We're delighted to welcome you to the Flybeth family. Access exclusive rates and manage your entire travel ecosystem from our customized dashboard.</p>
          <a href="{{loginUrl}}" class="btn">Explore Destinations</a>
        `),
        availableVariables: ["firstName", "loginUrl"],
      },
      {
        slug: "password-reset",
        name: "Password Reset",
        subject: "Reset your Flybeth password",
        htmlContent: getHtml(`
          <div class="title">Reset your password</div>
          <p class="text">Hello {{firstName}}, we received a request to reset your password. Click the button below to choose a new one.</p>
          <a href="{{resetUrl}}" class="btn">Reset Password</a>
          <p class="text" style="font-size: 12px; color: #9ca3af; margin-top: 20px;">If you didn't request this, you can safely ignore this email.</p>
        `),
        availableVariables: ["firstName", "resetUrl"],
      },
      {
        slug: "booking-confirmation",
        name: "E-Ticket & Booking Confirmation",
        subject: "Your E-Ticket for {{destination}} is ready!",
        htmlContent: getHtml(`
          <div class="title">Booking Confirmed!</div>
          <p class="text">Hi {{firstName}}, your payment was successful and your e-ticket has been issued for your trip to {{destination}}.</p>
          <div class="box">
            <p><strong>Booking Reference (PNR):</strong> {{pnr}}</p>
            <p><strong>Passenger:</strong> {{firstName}} {{lastName}}</p>
            <p><strong>Total Paid:</strong> {{currency}} {{amount}}</p>
          </div>
          <a href="{{manageUrl}}" class="btn">Manage Booking</a>
        `),
        availableVariables: ["firstName", "lastName", "destination", "pnr", "currency", "amount", "manageUrl"],
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
