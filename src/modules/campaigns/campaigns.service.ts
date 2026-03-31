import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Campaign, CampaignDocument } from "./schemas/campaign.schema";
import { NotificationsService } from "../notifications/notifications.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
  ) {}

  async findAll() {
    return this.campaignModel.find().populate("createdBy", "firstName lastName").sort({ createdAt: -1 }).exec();
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
    } else if (campaign.targetAudience === "roles" && campaign.targetRoles?.length > 0) {
      query = { role: { $in: campaign.targetRoles } };
    } else if (campaign.targetAudience === "specific" && campaign.specificUsers?.length > 0) {
      query = { _id: { $in: campaign.specificUsers } };
    }
    // "all" uses an empty query to retrieve everyone.

    // Using usersService.findAll could impose pagination limits. For campaign blasts we need all targeted users.
    // However, depending on how usersService is structured, we will use it with a large limit.
    const usersResponse = await this.usersService.findAll({ ...query, limit: 100000 } as any);
    let users: any[] = usersResponse.data || [];
    
    // Inject Custom Emails (External guests)
    if (campaign.customEmails && campaign.customEmails.length > 0) {
      const externalUsers = campaign.customEmails.map(email => ({
        email: email.trim(),
        firstName: 'Guest',
        lastName: 'User'
      }));
      users = [...users, ...externalUsers];
    }
    
    this.logger.log(`Starting campaign blast: ${campaign.title} to ${users.length} users`);

    // Prepend the attachment image if it exists
    let baseContent = campaign.content;
    if (campaign.imageUrl) {
      baseContent = `<div style="text-align: center; margin-bottom: 20px;"><img src="${campaign.imageUrl}" style="max-width: 100%; border-radius: 8px;" alt="Campaign Attachment" /></div>` + baseContent;
    }

    for (const user of users) {
      // Safe fallback variable replacement
      const userContent = baseContent
        .replace(/\{\{firstName\}\}/g, user.firstName || 'Guest')
        .replace(/\{\{lastName\}\}/g, user.lastName || 'User');
        
      const userSubject = campaign.subject
        .replace(/\{\{firstName\}\}/g, user.firstName || 'Guest')
        .replace(/\{\{lastName\}\}/g, user.lastName || 'User');

      const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
             @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
             body { margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
             .wrapper { padding: 40px 20px; }
             .container { background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; }
             .content { font-size: 16px; line-height: 1.8; color: #334155; }
             .content p { margin-top: 0; margin-bottom: 20px; }
             .content img { max-width: 100%; height: auto; border-radius: 12px; display: block; margin: 24px auto; }
             .content h1, .content h2, .content h3 { color: #0f172a; margin-top: 32px; margin-bottom: 16px; font-weight: 700; line-height: 1.3; }
             .header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #f1f5f9; }
             .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #94a3b8; line-height: 1.5; }
             .logo { font-size: 24px; font-weight: 900; color: #0D1DAD; letter-spacing: -1px; text-transform: uppercase; }
             .logo span { color: #FF3D00; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <img src="https://agent.flybeth.com/_nuxt/logo.CJ2BWGNK.png" alt="Flybeth Logo" height="32" style="height: 32px; display: block; margin: 0 auto; border: none; outline: none;" />
              </div>
              <div class="content">
                ${userContent}
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} Flybeth Travel. All rights reserved.<br>
                You are receiving this because you are part of our community.
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
        { firstName: user.firstName || 'Guest', lastName: user.lastName || 'User' }
      );
    }

    campaign.status = "sent";
    await campaign.save();
    return { sent: users.length };
  }
}
