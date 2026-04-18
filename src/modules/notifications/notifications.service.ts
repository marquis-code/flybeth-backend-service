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

    const saved = await notification.save();
    
    // Broadcast to user in real-time
    this.chatGateway.sendNotificationToUser(params.userId, saved);

    return saved;
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    variables?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.emailQueue.add(
        "send-email",
        {
          to,
          subject,
          html,
          variables,
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
    const title = "Your Journey is Confirmed! ✈️";
    const content = `
      <div style="text-align: center; margin-bottom: 40px;">
        <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=1200" alt="Flight" style="width: 100%; height: 280px; object-fit: cover; border-radius: 24px; margin-bottom: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.15);" />
      </div>

      <p style="font-size: 19px; color: #1e293b; font-weight: 500;">Hi <strong>${params.firstName}</strong>,</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.8;">The world is waiting for you! We are delighted to confirm that your flight booking has been successfully processed and ticketed.</p>
      
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 32px; padding: 45px; margin: 40px 0; position: relative; overflow: hidden; box-shadow: inset 0 2px 4px rgba(255,255,255,0.8);">
        <div style="position: absolute; top: 0; right: 0; width: 160px; height: 160px; background: #0D1DAD; opacity: 0.03; border-radius: 0 0 0 100%;"></div>
        
        <div style="margin-bottom: 35px;">
          <h3 style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3em; margin: 0 0 15px 0; font-weight: 800;">Booking Reference (PNR)</h3>
          <p style="color: #0D1DAD; font-size: 56px; font-weight: 900; margin: 0; letter-spacing: -2px; text-shadow: 2px 2px 0px rgba(13,29,173,0.05);">${params.pnr}</p>
        </div>
        
        <div style="border-top: 1px dashed #cbd5e1; padding-top: 35px; display: grid; gap: 30px;">
          <div>
            <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 800;">Flight Route Overview</p>
            <p style="margin: 0; color: #1e293b; font-size: 20px; font-weight: 700;">${params.flightDetails}</p>
          </div>
          <div>
            <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 800;">Total Settlement Paid</p>
            <p style="margin: 0; color: #FF3D00; font-size: 28px; font-weight: 900;">${params.currency} ${params.totalAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div class="action-area" style="text-align: center;">
        <a href="${this.configService.get("CLIENT_URL")}/bookings/${params.pnr}" class="btn">View Boarding Pass</a>
      </div>

      <div style="background: #fffafb; border-radius: 20px; padding: 30px; border: 1px solid #fee2e2; margin-top: 45px; display: flex; gap: 20px; align-items: start;">
        <span style="font-size: 28px;">✨</span>
        <p style="margin: 0; font-size: 15px; color: #7f1d1d; line-height: 1.7;">
          <strong>Traveler Wisdom:</strong> Please verify all passport requirements for your destination. We recommend arriving at the airport at least 3 hours prior to international departures.
        </p>
      </div>
    `;

    await this.sendEmail(
      params.email,
      `Booking Confirmed: ${params.pnr} - Flybeth`,
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const title = "Welcome to a New Era of Travel! 🌍";
    const content = `
      <div style="text-align: center; margin-bottom: 40px;">
        <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=1200" alt="Travel" style="width: 100%; height: 300px; object-fit: cover; border-radius: 32px; margin-bottom: 35px; box-shadow: 0 25px 50px rgba(0,0,0,0.12);" />
      </div>

      <p style="font-size: 19px; color: #1e293b; font-weight: 600;">Hi ${firstName},</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.8;">We're delighted to welcome you to the Flybeth family! Our mission is to make every journey feel effortless, premium, and truly unforgettable.</p>
      
      <div style="margin: 50px 0; background-color: #f8fafc; border-radius: 32px; padding: 20px; border: 1px solid #f1f5f9;">
        <div style="padding: 30px; margin-bottom: 20px; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; display: flex; align-items: start; gap: 20px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
          <div style="width: 60px; height: 60px; background: rgba(13, 29, 173, 0.05); border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 28px;">💎</div>
          <div style="flex-grow: 1;">
            <p style="margin: 0; color: #0D1DAD; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.15em;">Elite Inventory</p>
            <p style="margin: 8px 0 0 0; color: #475569; font-size: 15px; line-height: 1.6;">Unlock global rates for flights and luxury accommodation seamlessly synced to your account.</p>
          </div>
        </div>
        
        <div style="padding: 30px; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; display: flex; align-items: start; gap: 20px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
          <div style="width: 60px; height: 60px; background: rgba(255, 61, 0, 0.05); border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 28px;">⚡</div>
          <div style="flex-grow: 1;">
            <p style="margin: 0; color: #FF3D00; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.15em;">Seamless Design</p>
            <p style="margin: 8px 0 0 0; color: #475569; font-size: 15px; line-height: 1.6;">Manage your entire travel ecosystem from a visually stunning dashboard customized just for you.</p>
          </div>
        </div>
      </div>

      <div class="action-area" style="text-align: center;">
        <a href="${this.configService.get("CLIENT_URL")}/search" class="btn">Discover Your Next Destination</a>
      </div>
      
      <p style="text-align: center; font-size: 14px; color: #94a3b8; margin-top: 45px; font-weight: 500;">
        Thank you for choosing Flybeth. We can't wait to see where you go next!
      </p>
    `;
    await this.sendEmail(
      email,
      "Welcome to Flybeth - Elevate Your Global Journey 🛫",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendOtpEmail(
    email: string,
    firstName: string,
    otp: string,
  ): Promise<void> {
    const title = "Security Verification Code 🛡️";
    const content = `
      <div style="text-align: center; margin-bottom: 40px;">
        <img src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=1200" alt="Security" style="width: 100%; height: 200px; object-fit: cover; border-radius: 24px; margin-bottom: 25px;" />
      </div>
      
      <p style="font-size: 19px; color: #1e293b;">Hi <strong>${firstName}</strong>,</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.8;">To secure your digital session, please use the following one-time password (OTP) to complete your authentication to <strong>Flybeth</strong>.</p>
      
      <div style="background: #f8fafc; padding: 60px 30px; text-align: center; border-radius: 32px; border: 2px dashed #0D1DAD; margin: 45px 0;">
        <span style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.3em; display: block; margin-bottom: 25px;">Secure Verification Digest</span>
        <span style="font-size: 64px; font-weight: 900; letter-spacing: 16px; color: #0D1DAD; font-family: 'Outfit', monospace;">${otp}</span>
      </div>
      
      <div style="background: #fff1f2; border-radius: 20px; padding: 30px; border: 1px solid #fecdd3; display: flex; gap: 20px; align-items: start;">
        <span style="font-size: 28px;">🚨</span>
        <p style="margin: 0; font-size: 15px; color: #9f1239; line-height: 1.7;">
          <strong>Security Protocol:</strong> This code expires in 10 minutes. <strong>Never</strong> share this PIN with anyone, including Flybeth technicians.
        </p>
      </div>
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
  ): Promise<void> {
    const title = "Authentication Guard 🔒";
    const resetUrl = `${this.configService.get("CLIENT_URL")}/auth/reset-password?token=${token}`;
    const content = `
      <div style="text-align: center; margin-bottom: 40px;">
        <div style="width: 100px; height: 100px; background: rgba(13, 29, 173, 0.05); border-radius: 100px; display: inline-flex; align-items: center; justify-content: center; font-size: 48px; margin: 0 auto;">🔒</div>
      </div>

      <p style="font-size: 19px; color: #1e293b; font-weight: 600;">Hi ${firstName},</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.8;">We received a request to reset the password for your Flybeth account. To proceed with setting a new credential, please click the secure link below.</p>
      
      <div class="action-area" style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset My Password</a>
      </div>
      
      <div style="background: #f8fafc; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; margin-top: 40px;">
        <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Trouble with the button?</p>
        <p style="margin: 0; font-size: 13px; color: #0D1DAD; word-break: break-all; font-family: monospace;">${resetUrl}</p>
      </div>

      <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
          <strong>Security Note:</strong> If you did not request this, please ignore this message. Your account remains protected and no action is required.
        </p>
      </div>
    `;
    await this.sendEmail(
      email,
      "Password Reset Instructions - Flybeth",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendAgentWelcomeEmail(email: string, firstName: string): Promise<void> {
    const title = "Welcome to the Inner Circle 🚀";
    const logoUrl = this.configService.get("APP_LOGO_URL") || "https://flybeth.s3.us-east-2.amazonaws.com/flight-booking/general/logo.png";
    const content = `
      <div style="background-color: #f8fafc; padding: 25px; border-radius: 40px;">
        <div style="background-color: #ffffff; max-width: 640px; margin: 0 auto; border-radius: 32px; overflow: hidden; box-shadow: 0 40px 80px rgba(13, 29, 173, 0.1); border: 1px solid #f1f5f9;">
          
          <!-- Large Cover Image -->
          <div style="width: 100%; height: 280px; background: url('https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80&w=1200') center/cover;"></div>

          <!-- Header Logo Overlay -->
          <div style="text-align: center; margin-top: -45px;">
            <div style="background: white; padding: 20px 40px; display: inline-block; border-radius: 100px; box-shadow: 0 15px 40px rgba(0,0,0,0.08);">
              <img src="${logoUrl}" alt="Flybeth" style="height: 40px; width: auto; vertical-align: middle;" />
            </div>
          </div>

          <div style="padding: 60px 60px; background: #ffffff;">
            
            <h1 style="color: #0f172a; font-size: 32px; font-weight: 800; margin: 0 0 35px 0; letter-spacing: -1px; text-align: center;">
              Unrivaled Partnership Awaits 🤝
            </h1>

            <p style="font-size: 18px; line-height: 2; color: #334155; margin-top: 0; margin-bottom: 25px;">
              Dearest <strong>${firstName}</strong>,
            </p>
            
            <p style="font-size: 17px; line-height: 1.9; color: #475569; margin-bottom: 25px;">
              I am thrilled to personally welcome your agency to the Flybeth Global Network. You are the bridge between explorers and the world, and we are here to amplify your brilliance.
            </p>
            
            <p style="font-size: 17px; line-height: 1.9; color: #475569; margin-bottom: 45px;">
              Our ecosystem is built for speed, precision, and profit. We recognize the immense value you bring, and we've built the tools to match it.
            </p>

            <!-- Agent Mechanics Section -->
            <div style="margin: 55px 0; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 32px; padding: 50px 40px; position: relative; border: 1px solid #e2e8f0;">
              <div style="text-align: center; margin-bottom: 35px;">
                <span style="background: #0D1DAD; color: #ffffff; padding: 10px 24px; border-radius: 100px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em;">
                  ✨ Commercial Advantage
                </span>
              </div>

              <div style="display: grid; gap: 30px;">
                <div style="background: white; padding: 30px; border-radius: 24px; box-shadow: 0 10px 20px rgba(0,0,0,0.02); border: 1px solid #f1f5f9;">
                  <h4 style="margin: 0 0 15px 0; color: #0D1DAD; font-size: 17px; font-weight: 800; display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 26px;">📊</span> Wholesale GDS Routing
                  </h4>
                  <p style="margin: 0; font-size: 15px; line-height: 1.8; color: #64748b;">
                    Access institutional flight APIs with automated mark-up logic and negotiated global airfares.
                  </p>
                </div>

                <div style="background: white; padding: 30px; border-radius: 24px; box-shadow: 0 10px 20px rgba(0,0,0,0.02); border: 1px solid #f1f5f9;">
                  <h4 style="margin: 0 0 15px 0; color: #FF3D00; font-size: 17px; font-weight: 800; display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 26px;">💰</span> Automated Clearing
                  </h4>
                  <p style="margin: 0; font-size: 15px; line-height: 1.8; color: #64748b;">
                    Transparent commission structures with direct settlement to your verified payout institution.
                  </p>
                </div>
              </div>
            </div>

            <div style="text-align: center; margin-top: 60px; padding-top: 50px; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0 0 20px 0; font-family: 'Georgia', serif; font-style: italic; font-size: 22px; color: #475569;">
                With boundless love and excitement,
              </p>
              <p style="margin: 0; font-weight: 900; font-size: 22px; color: #1e293b; letter-spacing: -1px;">
                Oluremi Oshinkoya
              </p>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em;">
                Founder & CEO, Flybeth
              </p>
            </div>

          </div>
        </div>
      </div>
    `;

    await this.sendEmail(email, "A formal B2B welcome from our CEO 💌", content);
  }

  async sendAgentSignupUnderReviewEmail(
    email: string,
    firstName: string,
  ): Promise<void> {
    const title = "Application Under Review ⏳";
    const content = `
      <div style="text-align: center; margin-bottom: 40px;">
        <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200" alt="Review" style="width: 100%; height: 220px; object-fit: cover; border-radius: 24px; margin-bottom: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);" />
      </div>
      
      <p style="font-size: 19px; color: #1e293b;">Hi <strong>${firstName}</strong>,</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.8;">Thank you for registering your agency. We have successfully secured your onboarding pipeline data and compliance documents.</p>
      
      <div style="background: #fffaf0; border-left: 6px solid #FF3D00; padding: 35px; margin: 40px 0; border-radius: 0 24px 24px 0; box-shadow: 0 10px 20px rgba(0,0,0,0.02);">
        <p style="color: #FF3D00; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 12px 0;">Internal Compliance Queue</p>
        <p style="margin: 0; color: #475569; font-size: 16px; line-height: 1.8;">Our global compliance team is strictly reviewing your provided legal documentation to finalize your Tier allocation. This process typically mandates 24-48 hours. We will notify you here the exact second you are cleared for commercial operations.</p>
      </div>

      <div class="action-area" style="text-align: center;">
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
    const title = "Compliance Verified ✅";
    const content = `
      <div style="text-align: center; margin-bottom: 40px;">
        <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1200" alt="Success" style="width: 100%; height: 200px; object-fit: cover; border-radius: 24px; margin-bottom: 25px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);" />
      </div>

      <p style="font-size: 19px; color: #1e293b;">Hi <strong>${firstName}</strong>,</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.8;">Excellent progression! Our compliance division has firmly authenticated and <strong>safely approved</strong> your submitted <strong>${documentType}</strong>.</p>
      
      <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 24px; padding: 35px; margin: 40px 0; display: flex; gap: 20px; align-items: start;">
        <span style="font-size: 28px;">🛡️</span>
        <p style="margin: 0; color: #065f46; font-size: 16px; line-height: 1.8;">
          Your identity matrices have been cleared and persistently lodged inside our secure vaults. This moves you substantially closer to unrestricted transactional capabilities.
        </p>
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
    const title = "Document Flagged ⚠️";
    const content = `
      <div style="text-align: center; margin-bottom: 40px;">
        <img src="https://images.unsplash.com/photo-1618044733300-9472054094ee?auto=format&fit=crop&q=80&w=1200" alt="Warning" style="width: 100%; height: 200px; object-fit: cover; border-radius: 24px; margin-bottom: 25px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);" />
      </div>

      <p style="font-size: 19px; color: #1e293b;">Hi <strong>${firstName}</strong>,</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.8;">During a routine legal sweep, our compliance system flagged your submitted <strong>${documentType}</strong>. To proceed, we require a rapid correction.</p>
      
      <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 24px; padding: 35px; margin: 40px 0;">
        <h4 style="color: #be123c; margin: 0 0 12px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 800;">Internal Assessor Feedback</h4>
        <p style="margin: 0; color: #881337; font-size: 17px; font-weight: 500; line-height: 1.8; font-style: italic;">"${feedback}"</p>
      </div>

      <div class="action-area" style="text-align: center;">
        <a href="http://agent.flybeth.com/kyc" class="btn" style="background: #be123c;">Submit Correction Now</a>
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
    const title = "Deployment Authorized 🚀";
    const content = `
      <div style="text-align: center; margin-bottom: 45px;">
        <img src="https://images.unsplash.com/photo-1551041777-ed277b8eafc2?auto=format&fit=crop&q=80&w=1200" alt="Launch" style="width: 100%; height: 300px; object-fit: cover; border-radius: 32px; box-shadow: 0 25px 50px rgba(0,0,0,0.15);" />
      </div>

      <p style="font-size: 20px; color: #1e293b; font-weight: 700;">Congratulations <strong>${firstName}</strong>!</p>
      <p style="font-size: 17px; color: #475569; line-height: 1.8;">Your partnership architecture has been rigorously analyzed and passed our global clearing house. <strong>Your agency is now live!</strong></p>
      
      <div style="background: #f8fafc; border: 2px dashed #0D1DAD; border-radius: 32px; padding: 40px; margin: 45px 0; text-align: center;">
        <p style="color: #64748b; font-weight: 800; margin: 0 0 20px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.25em;">Secure Access Key</p>
        <p style="color: #0D1DAD; font-weight: 900; font-size: 22px; margin: 0 0 10px 0; font-family: monospace;">${email}</p>
        <p style="color: #94a3b8; font-size: 14px; margin: 0;">Access initialized with your registered security credentials.</p>
      </div>
      
      <div class="action-area" style="text-align: center;">
        <a href="http://agent.flybeth.com/auth/login" class="btn">Initialize Dashboard</a>
      </div>
    `;
    await this.sendEmail(
      email,
      "You are live! Full B2B platform unlocked.",
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
    const title = "Incomplete Journey ⏳";
    const content = `
      <div style="text-align: center; margin-bottom: 40px;">
        <img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1200" alt="Travel" style="width: 100%; height: 220px; object-fit: cover; border-radius: 24px; margin-bottom: 25px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);" />
      </div>

      <p style="font-size: 19px; color: #1e293b;">Hi <strong>${params.firstName}</strong>,</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.8;">Our engine noticed you paused your selection to <strong>${params.itemName}</strong>. Don't let your perfect trip slip away.</p>
      
      <div style="background: rgba(255, 61, 0, 0.03); border: 2px dashed #FF3D00; border-radius: 24px; padding: 35px; margin: 40px 0; text-align: center;">
        <p style="color: #FF3D00; font-weight: 800; margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Dynamic Pricing Alert</p>
        <p style="color: #1e293b; font-size: 17px; font-weight: 600; margin: 0;">We've temporarily locked this rate for you. Secure it Fundamental now before it resets.</p>
      </div>
      
      <div class="action-area" style="text-align: center;">
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
    const title = "Clearing Successful 💳";
    const content = `
      <p style="font-size: 19px; color: #1e293b;">Dear <strong>${params.firstName}</strong>,</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.8;">We have securely cleared your payment request. Your transaction details are recorded below for your records.</p>
      
      <div style="background: #f8fafc; border-radius: 32px; padding: 45px; margin: 40px 0; border: 1px solid #e2e8f0; box-shadow: 0 10px 20px rgba(0,0,0,0.02);">
        <table style="width: 100%; font-size: 16px; border-collapse: collapse;">
          <tr>
            <td style="padding: 15px 0; color: #64748b; font-weight: 600;">Authorized Amount</td>
            <td style="padding: 15px 0; text-align: right; color: #0D1DAD; font-weight: 900; font-size: 20px;">${params.currency} ${params.amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 15px 0; color: #64748b; font-weight: 600;">Transaction Ref</td>
            <td style="padding: 15px 0; text-align: right; color: #1e293b; font-family: monospace; font-weight: 700; font-size: 14px;">${params.reference}</td>
          </tr>
          <tr>
            <td style="padding: 15px 0; color: #64748b; font-weight: 600;">Booking ID (PNR)</td>
            <td style="padding: 15px 0; text-align: right; color: #1e293b; font-weight: 700; letter-spacing: 2px;">${params.pnr}</td>
          </tr>
          <tr style="border-top: 2px dashed #cbd5e1;">
            <td style="padding: 25px 0 0; color: #64748b; font-weight: 600;">Timestamp</td>
            <td style="padding: 25px 0 0; text-align: right; color: #1e293b; font-weight: 700;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
      </div>
    `;

    await this.sendEmail(
      params.email,
      `Ledger Receipt Confirmed - ${params.reference}`,
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
                <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                    <h1 style="color: #0D1DAD; font-size: 28px; font-weight: 800; letter-spacing: -1px;">Hi {{firstName}}! 👋</h1>
                    <p style="font-size: 16px; line-height: 1.8; color: #475569;">We've saved your progress for your trip to <strong>{{destination}}</strong>. Don't let your perfect itinerary slip away!</p>
                    <div style="margin: 40px 0;">
                        <a href="{{checkoutUrl}}" class="btn">Complete Your Booking</a>
                    </div>
                    <p style="font-size: 12px; color: #94a3b8;">Prices change as supply evolves, so we recommend finalizing soon.</p>
                </div>`,
        availableVariables: ["firstName", "destination", "checkoutUrl"],
      },
      {
        slug: "payment-reminder",
        name: "Payment Reminder",
        subject: "Secure your ticket for {{pnr}} 💳",
        htmlContent: `
                <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                    <h2 style="color: #0f172a; font-size: 28px; font-weight: 800; letter-spacing: -1px;">One last step, {{firstName}}!</h2>
                    <p style="font-size: 16px; line-height: 1.8; color: #475569;">Your booking <strong>{{pnr}}</strong> is currently pending final clearing and settlement.</p>
                    <div style="margin: 40px 0;">
                        <a href="{{paymentUrl}}" class="btn">Secure Ticket Now</a>
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
