import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Commission, CommissionDocument } from "./schemas/commission.schema";

@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);

  constructor(
    @InjectModel(Commission.name)
    private commissionModel: Model<CommissionDocument>,
  ) {}

  async findAll() {
    return this.commissionModel.find().exec();
  }

  async findByAirline(airlineCode: string, tenantId?: string) {
    // Check for tenant-specific commission first, then global
    if (tenantId) {
      const tenantCommission = await this.commissionModel
        .findOne({
          airlineCode: airlineCode.toUpperCase(),
          tenant: tenantId,
          isActive: true,
        })
        .exec();
      if (tenantCommission) return tenantCommission;
    }

    return this.commissionModel
      .findOne({
        airlineCode: airlineCode.toUpperCase(),
        tenant: null,
        isActive: true,
      })
      .exec();
  }

  async upsert(data: Partial<Commission>) {
    const { airlineCode, tenant } = data;
    if (!airlineCode) {
      throw new Error("Airline code is required for commission upsert");
    }
    return this.commissionModel.findOneAndUpdate(
      { airlineCode: airlineCode.toUpperCase(), tenant: tenant || null },
      { $set: data },
      { upsert: true, new: true },
    );
  }

  async delete(id: string) {
    return this.commissionModel.findByIdAndDelete(id);
  }
}
