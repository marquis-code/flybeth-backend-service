// src/modules/agents/fraud.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "../users/schemas/user.schema";
import { AgentStatus } from "../../common/constants/roles.constant";

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async checkFraudFlags(userId: string, ipAddress: string): Promise<string[]> {
    const flags: string[] = [];
    const user = await this.userModel.findById(userId);

    if (!user) return flags;

    // 1. Multiple accounts with same IP
    const sameIpUsers = await this.userModel.countDocuments({
      _id: { $ne: userId },
      lastIp: ipAddress, // Assuming we track IP
    });
    if (sameIpUsers > 0) {
      flags.push("MULTIPLE_ACCOUNTS_SAME_IP");
    }

    // 2. Different names on account vs business (Simplified check)
    if (user.firstName && user.agentProfile?.agencyName) {
      // Logic to check if names are vastly different or suspicious
    }

    return flags;
  }

  async autoFlagAgent(userId: string, reason: string) {
    this.logger.warn(`Auto-flagging agent ${userId} for reason: ${reason}`);
    await this.userModel.findByIdAndUpdate(userId, {
      agentStatus: AgentStatus.UNDER_REVIEW,
      // Add to a fraudLogs array if it exists
    });
  }
}
