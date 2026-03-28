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

    const usersResponse = await this.usersService.findAll({ 
      role: { $in: campaign.targetRoles } 
    } as any);
    const users = usersResponse.data;
    
    this.logger.log(`Starting campaign blast: ${campaign.title} to ${users.length} users`);

    for (const user of users) {
      await this.notificationsService.sendEmail(
        user.email,
        campaign.subject,
        campaign.content,
      );
    }

    campaign.status = "sent";
    await campaign.save();
    return { sent: users.length };
  }
}
