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
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=800" alt="Flight" style="width: 100%; height: 260px; object-fit: cover; border-radius: 20px; margin-bottom: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);" />
      </div>

      <p style="font-size: 18px; color: #1e293b;">Hi <strong>${params.firstName}</strong>,</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.6;">The world is waiting for you! We are excited to firmly confirm that your flight booking has been successfully processed and definitively ticketed.</p>
      
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; margin: 40px 0; position: relative; overflow: hidden; box-shadow: inset 0 2px 4px rgba(255,255,255,0.8);">
        <div style="position: absolute; top: 0; right: 0; width: 140px; height: 140px; background: #FF3D00; opacity: 0.04; border-radius: 0 0 0 100%;"></div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.25em; margin: 0 0 10px 0; font-weight: 800;">Booking Reference (PNR)</h3>
          <p style="color: #0D1DAD; font-size: 48px; font-weight: 900; margin: 0; font-family: 'Inter', sans-serif; letter-spacing: -2px; text-shadow: 2px 2px 0px rgba(13,29,173,0.1);">${params.pnr}</p>
        </div>
        
        <div style="border-top: 1px dashed #cbd5e1; padding-top: 30px; display: grid; gap: 25px;">
          <div>
            <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 800;">Flight Route Overview</p>
            <p style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 700;">${params.flightDetails}</p>
          </div>
          <div>
            <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 800;">Total Settlement Paid</p>
            <p style="margin: 0; color: #FF3D00; font-size: 26px; font-weight: 900;">${params.currency} ${params.totalAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div class="action-area" style="text-align: center;">
        <a href="${this.configService.get("CLIENT_URL")}/bookings/${params.pnr}" class="btn" style="background: linear-gradient(135deg, #FF3D00 0%, #cc3100 100%);">Access Digital Boarding Dashboard</a>
      </div>

      <div style="background: #fffaf0; border-radius: 16px; padding: 25px; border: 1px solid #ffedd5; margin-top: 40px; display: flex; gap: 15px; align-items: start;">
        <span style="font-size: 24px;">💡</span>
        <p style="margin: 0; font-size: 14px; color: #9a3412; line-height: 1.6;">
          <strong>Pro Travel Tip:</strong> Ensure you have all necessary travel documents and visas ready for your destination. We strongly recommend arriving at the airport at least 3 hours prior to international departures. Safe travels!
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
      <div style="text-align: center; margin-bottom: 35px;">
        <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800" alt="Travel" style="width: 100%; height: 260px; object-fit: cover; border-radius: 24px; margin-bottom: 30px; box-shadow: 0 15px 35px rgba(0,0,0,0.1);" />
      </div>

      <p style="font-size: 18px; color: #1e293b; font-weight: 600;">Hi ${firstName},</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.7;">We're absolutely delighted to welcome you to the Flybeth family! Our mission is to make every journey feel effortless, premium, and truly unforgettable.</p>
      
      <div style="margin: 45px 0; background-color: #f8fafc; border-radius: 24px; padding: 15px; border: 1px solid #f1f5f9;">
        <div style="padding: 24px; margin-bottom: 15px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; align-items: start; gap: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="width: 54px; height: 54px; background: #eff6ff; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px;">💎</div>
          <div style="margin-left: 15px; flex-grow: 1;">
            <p style="margin: 0; color: #0D1DAD; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Elite Booking Inventory</p>
            <p style="margin: 6px 0 0 0; color: #475569; font-size: 15px; line-height: 1.6;">Unlock massive global rates for flights and luxury accommodation seamlessly synced to your account.</p>
          </div>
        </div>
        
        <div style="padding: 24px; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; align-items: start; gap: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="width: 54px; height: 54px; background: #fff5f5; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px;">⚡</div>
          <div style="margin-left: 15px; flex-grow: 1;">
            <p style="margin: 0; color: #FF3D00; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Seamless Intelligence</p>
            <p style="margin: 6px 0 0 0; color: #475569; font-size: 15px; line-height: 1.6;">Manage your entire travel ecosystem from a single visually stunning dashboard customized just for you.</p>
          </div>
        </div>
      </div>

      <div class="action-area" style="margin-top: 55px; text-align: center;">
        <a href="${this.configService.get("CLIENT_URL")}/search" class="btn" style="background: #0f172a; padding: 22px 45px; border-radius: 100px;">Explore Your First Destination</a>
      </div>
      
      <p style="text-align: center; font-size: 14px; color: #94a3b8; margin-top: 40px; font-weight: 500;">
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
    const title = "Zero-Trust Verification Code 🛡️";
    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=800" alt="Security" style="width: 100%; height: 180px; object-fit: cover; border-radius: 20px; margin-bottom: 25px;" />
      </div>
      
      <p style="font-size: 18px; color: #1e293b;">Hi <strong>${firstName}</strong>,</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.6;">For your absolute security and compliance tracking, please copy the following one-time password (OTP) to securely complete your digital authentication sequence to <strong>Flybeth</strong>.</p>
      
      <div class="otp-card" style="background: url('https://www.transparenttextures.com/patterns/cubes.png') #f8fafc; padding: 50px 30px; text-align: center; border-radius: 24px; border: 2px dashed #0D1DAD; margin: 40px 0;">
        <span class="otp-label" style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.25em; display: block; margin-bottom: 15px;">Secure Authentication Digest</span>
        <span class="otp-code" style="font-size: 64px; font-weight: 900; letter-spacing: 12px; color: #0D1DAD; font-family: monospace;">${otp}</span>
      </div>
      
      <div style="background: #fff5f5; border-radius: 16px; padding: 25px; border: 1px solid #fee2e2; display: flex; gap: 15px; align-items: start;">
        <span style="font-size: 24px;">🚨</span>
        <p style="margin: 0; font-size: 14px; color: #b91c1c; line-height: 1.6;">
          <strong>Security Note:</strong> This protocol code automatically destructs in 10 minutes. <strong>Never</strong> share this PIN with anyone remotely, including Flybeth staff. We will never explicitly ask for it.
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
    const title = "Password Reset Request";
    const resetUrl = `${this.configService.get("CLIENT_URL")}/auth/reset-password?token=${token}`;
    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; background: #fff1f2; border-radius: 100px; display: inline-flex; align-items: center; justify-content: center; font-size: 40px; margin: 0 auto;">🔒</div>
      </div>

      <p>Hi ${firstName},</p>
      <p>We received a request to reset the password for your Flybeth account. If you made this request, please click the button below to set a new password.</p>
      
      <div class="action-area" style="margin: 40px 0;">
        <a href="${resetUrl}" class="btn">Reset My Password</a>
      </div>
      
      <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
        If the button above doesn't work, copy and paste this link into your browser:<br>
        <span style="color: #0D1DAD; word-break: break-all; font-size: 12px;">${resetUrl}</span>
      </p>

      <div class="divider"></div>
      
      <p style="font-size: 13px; color: #94a3b8;">
        <strong>Didn't request this?</strong> If you didn't ask to reset your password, you can safely ignore this email. Your password will remain unchanged.
      </p>
    `;
    await this.sendEmail(
      email,
      "Password Reset Instructions - Flybeth",
      this.resendService.brandWrapper(title, content),
    );
  }

  async sendAgentWelcomeEmail(email: string, firstName: string): Promise<void> {
    const title = "Welcome to the Platform 🚀";
    const logoUrl = "https://res.cloudinary.com/marquis/image/upload/v1775916479/logo_aqftpd.png";
    const content = `
      <div style="background-color: #f8fafc; padding: 20px; font-family: 'Inter', -apple-system, sans-serif;">
        <div style="background-color: #ffffff; max-width: 640px; margin: 0 auto; border-radius: 32px; overflow: hidden; box-shadow: 0 30px 60px rgba(13, 29, 173, 0.08); border: 1px solid #f1f5f9;">
          
          <!-- Large Cover Image -->
          <div style="width: 100%; height: 260px; background: url('https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80&w=800') center/cover;"></div>

          <!-- Header Logo -->
          <div style="text-align: center; margin-top: -35px;">
            <div style="background: white; padding: 15px 30px; display: inline-block; border-radius: 100px; box-shadow: 0 10px 20px rgba(0,0,0,0.05);">
              <img src="${logoUrl}" alt="Flybeth" style="height: 35px; width: auto; vertical-align: middle;" />
            </div>
          </div>

          <div style="padding: 50px 50px; background: #ffffff;">
            
            <h1 style="color: #0f172a; font-size: 28px; font-weight: 900; margin: 0 0 30px 0; letter-spacing: -0.5px; text-align: center;">
              Welcome to the Flybeth Inner Circle 🤝
            </h1>

            <p style="font-size: 17px; line-height: 2; color: #334155; margin-top: 0; margin-bottom: 25px;">
              Dearest <strong>${firstName}</strong>,
            </p>
            
            <p style="font-size: 17px; line-height: 1.9; color: #475569; margin-bottom: 25px;">
              I am absolutely overjoyed to personally welcome your agency to the Flybeth commercial network! You aren't just an agent to us—you are the beating heart of modern travel, the bridge between explorers and the world.
            </p>
            
            <p style="font-size: 17px; line-height: 1.9; color: #475569; margin-bottom: 40px;">
              We've poured our souls into building an ecosystem that doesn't just work, but feels like sheer magic. The value you bring to your clients is extraordinary, and we want to empower you with B2B tools that instantly match your brilliance.
            </p>

            <!-- Magic Awaits You Section -->
            <div style="margin: 50px 0; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 24px; padding: 45px 35px; position: relative; border: 1px solid #e2e8f0;">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="background: #0D1DAD; color: #ffffff; padding: 8px 24px; border-radius: 100px; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em;">
                  ✨ Instant Agent Mechanics
                </span>
              </div>

              <div style="display: grid; gap: 30px;">
                <div style="background: white; padding: 25px; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                  <h4 style="margin: 0 0 10px 0; color: #0D1DAD; font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px; background: #eff6ff; padding: 10px; border-radius: 12px;">📊</span> Wholesale GDS Routing
                  </h4>
                  <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #64748b;">
                    Massive underlying flight APIs. Auto-advancing logic, negotiated airfares, and huge mark-up potentials.
                  </p>
                </div>

                <div style="background: white; padding: 25px; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                  <h4 style="margin: 0 0 10px 0; color: #FF3D00; font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px; background: #fff5f5; padding: 10px; border-radius: 12px;">💰</span> Automated Commissions
                  </h4>
                  <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #64748b;">
                    Transparent clearing structures that deposit directly to your verified payout institution automatically.
                  </p>
                </div>
              </div>
            </div>

            <div style="text-align: center; margin-top: 50px; padding-top: 40px; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0 0 15px 0; font-family: 'Georgia', serif; font-style: italic; font-size: 22px; color: #475569;">
                With boundless love and excitement,
              </p>
              <p style="margin: 0; font-weight: 900; font-size: 20px; color: #1e293b; letter-spacing: -0.5px;">
                Oluremi Oshinkoya
              </p>
              <p style="margin: 5px 0 0 0; font-size: 13px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em;">
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
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800" alt="Review" style="width: 100%; height: 200px; object-fit: cover; border-radius: 20px; margin-bottom: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);" />
      </div>
      
      <p style="font-size: 18px; color: #1e293b;">Hi <strong>${firstName}</strong>,</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.6;">Thank you for registering your agency with Flybeth. We have successfully secured your onboarding pipeline data and compliance documents.</p>
      
      <div style="background: #fffaf0; border-left: 4px solid #FF3D00; padding: 25px; margin: 35px 0; border-radius: 0 16px 16px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
        <p style="color: #FF3D00; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 10px 0;">Internal Compliance Next Steps</p>
        <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6;">Our global compliance team is strictly reviewing your provided legal documentation to finalize your Tier allocation. This process legally mandates 24-48 hours. We will notify you here the exact second you are cleared for commercial operations.</p>
      </div>

      <div class="action-area" style="text-align: center; margin-top: 40px;">
        <a href="http://agent.flybeth.com/auth/login" class="btn" style="background: #0f172a;">Track Application Status</a>
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
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800" alt="Success" style="width: 100%; height: 180px; object-fit: cover; border-radius: 20px; margin-bottom: 25px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);" />
      </div>

      <p style="font-size: 18px; color: #1e293b;">Hi <strong>${firstName}</strong>,</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.6;">Excellent progression! Our compliance division has firmly authenticated and <strong>safely approved</strong> your submitted <strong>${documentType}</strong>.</p>
      
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 16px; padding: 25px; margin: 30px 0; display: flex; gap: 15px; align-items: start;">
        <span style="font-size: 24px;">🛡️</span>
        <p style="margin: 0; color: #065f46; font-size: 15px; line-height: 1.6;">
          Your document identity matrices have been cleared and persistently lodged inside our secure vaults. This moves you substantially closer to unrestricted transactional capabilities.
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
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://images.unsplash.com/photo-1618044733300-9472054094ee?auto=format&fit=crop&q=80&w=800" alt="Warning" style="width: 100%; height: 180px; object-fit: cover; border-radius: 20px; margin-bottom: 25px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);" />
      </div>

      <p style="font-size: 18px; color: #1e293b;">Hi <strong>${firstName}</strong>,</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.6;">During a routine legal authenticity sweep, our compliance system flagged your submitted <strong>${documentType}</strong>. To proceed, we need an immediate correction.</p>
      
      <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 20px; padding: 30px; margin: 30px 0;">
        <h4 style="color: #be123c; margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 800;">Direct Assessor Feedback</h4>
        <p style="margin: 0; color: #881337; font-size: 16px; font-weight: 500; line-height: 1.6; font-style: italic;">"${feedback}"</p>
      </div>

      <div class="action-area" style="margin-top: 40px; text-align: center;">
        <a href="http://agent.flybeth.com/kyc" class="btn" style="background: #be123c;">Over-ride With New Document Now</a>
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
    const title = "Global Deployment Authorized 🚀";
    const content = `
      <div style="text-align: center; margin-bottom: 40px;">
        <img src="https://images.unsplash.com/photo-1551041777-ed277b8eafc2?auto=format&fit=crop&q=80&w=800" alt="Launch" style="width: 100%; height: 260px; object-fit: cover; border-radius: 24px; box-shadow: 0 15px 35px rgba(0,0,0,0.1);" />
      </div>

      <p style="font-size: 19px; color: #1e293b; font-weight: 700;">Congratulations <strong>${firstName}</strong>!</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.7;">Your B2B compliance architecture has been rigorously analyzed and passed our entire clearing house. <strong>Your agency is now live out into production!</strong></p>
      
      <div style="background: #f8fafc; border: 2px dashed #0D1DAD; border-radius: 20px; padding: 30px; margin: 40px 0; text-align: center;">
        <p style="color: #64748b; font-weight: 800; margin: 0 0 15px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em;">Platform Credentials</p>
        <p style="color: #0D1DAD; font-weight: 900; font-size: 20px; margin: 0 0 8px 0; font-family: monospace;">${email}</p>
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">Secured with the global key assigned during onboarding.</p>
      </div>
      
      <div class="action-area" style="text-align: center; margin: 45px 0;">
        <a href="http://agent.flybeth.com/auth/login" class="btn" style="padding: 22px 50px; font-size: 17px; background: #0f172a;">Boot Up The Dashboard</a>
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
    const title = "Cart Expires Imminently ⏳";
    const content = `
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=800" alt="Nature" style="width: 100%; height: 200px; object-fit: cover; border-radius: 20px; margin-bottom: 25px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);" />
      </div>

      <p style="font-size: 18px; color: #1e293b;">Hi <strong>${params.firstName}</strong>,</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.6;">Our global routing engine noticed you abandoned your impending ${params.itemType} checkout to <strong>${params.itemName}</strong>.</p>
      
      <div style="background: #fff5f5; border: 2px dashed #FF3D00; border-radius: 16px; padding: 25px; margin: 30px 0; text-align: center;">
        <p style="color: #FF3D00; font-weight: 800; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Aviation algorithms update hourly</p>
        <p style="color: #991b1b; font-size: 16px; font-weight: 600; margin: 0;">We forcefully secured the pricing rate for a brief window. Secure it fundamentally now.</p>
      </div>
      
      <div class="action-area" style="text-align: center;">
        <a href="${params.url}" class="btn" style="background: linear-gradient(135deg, #FF3D00 0%, #aa2800 100%);">Resume Booking Safely</a>
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
      <p style="font-size: 18px; color: #1e293b;">Dear <strong>${params.firstName}</strong>,</p>
      <p style="font-size: 16px; color: #475569;">We have securely cleared your payment request protocol.</p>
      
      <div style="background: #f8fafc; border-radius: 20px; padding: 35px; margin: 30px 0; border: 1px solid #e2e8f0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
        <table style="width: 100%; font-size: 15px; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Gross Authorized</td>
            <td style="padding: 12px 0; text-align: right; color: #0D1DAD; font-weight: 900; font-size: 18px;">${params.currency} ${params.amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Clearing Gateway Ref</td>
            <td style="padding: 12px 0; text-align: right; color: #1e293b; font-family: monospace; font-weight: 700; font-size: 13px;">${params.reference}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Database PNR Bind</td>
            <td style="padding: 12px 0; text-align: right; color: #1e293b; font-weight: 700; letter-spacing: 2px;">${params.pnr}</td>
          </tr>
          <tr style="border-top: 2px dashed #cbd5e1;">
            <td style="padding: 12px 0; color: #64748b; padding-top: 20px; font-weight: 600;">Ledger Timestamp</td>
            <td style="padding: 12px 0; text-align: right; color: #1e293b; padding-top: 20px; font-weight: 700;">${new Date().toLocaleString()}</td>
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
