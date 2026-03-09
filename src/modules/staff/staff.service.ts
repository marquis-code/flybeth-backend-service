// src/modules/staff/staff.service.ts
import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "../users/schemas/user.schema";
import { Role, Permission } from "../../common/constants/roles.constant";
import { UsersService } from "../users/users.service";
import { NotificationsService } from "../notifications/notifications.service";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcryptjs";

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) { }

  async createStaff(adminId: string, staffData: any) {
    const existing = await this.usersService.findByEmail(staffData.email);
    if (existing) {
      throw new BadRequestException("Email already exists");
    }

    // Generate temporary password
    const tempPassword = uuidv4().substring(0, 8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const staff = new this.userModel({
      ...staffData,
      password: hashedPassword,
      role: Role.STAFF,
      firstLogin: true,
      isActive: true,
      isVerified: true,
    });

    const savedStaff = await staff.save();

    // Send email with temporary password
    await this.notificationsService.sendEmail(
      savedStaff.email,
      "Welcome to Flybeth - Your Staff Account",
      `<p>Hi ${savedStaff.firstName},</p>
             <p>An account has been created for you as a staff member.</p>
             <p>Your temporary password is: <strong>${tempPassword}</strong></p>
             <p>You will be required to change this password on your first login.</p>`,
    );

    this.logger.log(`Staff created: ${savedStaff.email} by Admin: ${adminId}`);
    return savedStaff;
  }

  async getStaffByTenant(tenantId: string) {
    return this.userModel
      .find({
        tenant: new Types.ObjectId(tenantId),
        role: Role.STAFF,
      })
      .exec();
  }

  async updateStaffPermissions(staffId: string, permissions: Permission[]) {
    return this.userModel
      .findByIdAndUpdate(staffId, { permissions }, { new: true })
      .exec();
  }

  async deleteStaff(staffId: string) {
    return this.userModel
      .findByIdAndUpdate(staffId, { isActive: false })
      .exec();
  }
}
