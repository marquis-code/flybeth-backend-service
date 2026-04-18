// src/modules/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "./schemas/user.schema";
import { NotificationsService } from "../notifications/notifications.service";
import { AgentStatus, Role } from "../../common/constants/roles.constant";
import {
  UpdateUserDto,
  UpdateUserRoleDto,
  UserQueryDto,
} from "./dto/update-user.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { paginate, PaginatedResult } from "../../common/utils/pagination.util";
import { hashPassword } from "../../common/utils/crypto.util";

import { AccessControlService } from "../access-control/access-control.service";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async create(userData: Partial<User>): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: userData.email });
    if (existing) {
      throw new ConflictException("User with this email already exists");
    }

    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    }

    if (typeof userData.role === 'string') {
      const roleEntity = await this.accessControlService.findRoleByName(userData.role);
      if (roleEntity) {
        userData.role = roleEntity._id;
      }
    }

    const user = new this.userModel(userData);
    return user.save();
  }

  async findByEmail(
    email: string,
    selectPassword = false,
  ): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    if (selectPassword) {
      query.select("+password +refreshToken");
    }
    const user = await query.populate("tenant").populate("role").exec();
    if (user && user.role) {
      user.permissions = (user.role as any).permissions || [];
    }
    return user;
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(id)
      .populate("tenant")
      .populate("role")
      .exec();

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.role) {
      user.permissions = (user.role as any).permissions || [];
    }

    return user;
  }

  async findAll(
    paginationDto: PaginationDto,
    queryDto?: UserQueryDto,
    currentUser?: any
  ): Promise<PaginatedResult<UserDocument>> {
    const query: any = {};

    // Auto-isolate by tenant for non-SUPER_ADMINS
    if (currentUser && currentUser.role?.name !== Role.SUPER_ADMIN) {
       if (currentUser.tenant) {
          query.tenant = currentUser.tenant._id || currentUser.tenant;
       }
    } else if (queryDto?.tenant) {
       query.tenant = queryDto.tenant;
    }
    
    if (queryDto?.role) {
       if (typeof queryDto.role === 'string') {
          const roleEntity = await this.accessControlService.findRoleByName(queryDto.role);
          if (roleEntity) {
             query.role = roleEntity._id;
          } else {
             query.role = queryDto.role;
          }
       } else if (typeof queryDto.role === 'object' && (queryDto.role as any)?.$in) {
          // Support resolving role name arrays in $in operator
          const resolvedRoles = await Promise.all(
             (queryDto.role as any).$in.map(async (val: any) => {
                if (typeof val === 'string' && val.length < 24) { // Heuristic for role name vs ObjectId
                   const role = await this.accessControlService.findRoleByName(val);
                   return role ? role._id : val;
                }
                return val;
             })
          );
          query.role = { $in: resolvedRoles };
       } else {
          query.role = queryDto.role;
       }
    }

    if (queryDto?.isActive !== undefined) query.isActive = queryDto.isActive;
    if (paginationDto.search) {
      query.$text = { $search: paginationDto.search };
    }

    return paginate(this.userModel, query, paginationDto, "tenant");
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const updateData: any = {};

    // Map flat DTO fields to nested schema
    if (updateUserDto.firstName) updateData.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName) updateData.lastName = updateUserDto.lastName;
    if (updateUserDto.phone) updateData.phone = updateUserDto.phone;
    if (updateUserDto.avatar) updateData.avatar = updateUserDto.avatar;
    if (updateUserDto.currency)
      updateData["preferences.currency"] = updateUserDto.currency;
    if (updateUserDto.language)
      updateData["preferences.language"] = updateUserDto.language;
    if (updateUserDto.emailNotifications !== undefined) {
      updateData["preferences.emailNotifications"] =
        updateUserDto.emailNotifications;
    }
    if (updateUserDto.pushNotifications !== undefined) {
      updateData["preferences.pushNotifications"] =
        updateUserDto.pushNotifications;
    }
    if (updateUserDto.twoFactorEnabled !== undefined) {
      updateData.twoFactorEnabled = updateUserDto.twoFactorEnabled;
    }
    if (updateUserDto.agencyName) updateData.agencyName = updateUserDto.agencyName;
    if (updateUserDto.agentProfile) {
      const keys = ['registrationNumber', 'country', 'businessAddress', 'website', 'whatsappNumber', 'billingAddress'];
      for (const k of keys) {
        if (updateUserDto.agentProfile[k] !== undefined) {
          updateData[`agentProfile.${k}`] = updateUserDto.agentProfile[k];
        }
      }
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .populate("tenant")
      .exec();

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async updateRole(
    id: string,
    updateRoleDto: UpdateUserRoleDto,
  ): Promise<UserDocument> {
    let roleId: any = updateRoleDto.role;
    
    if (typeof updateRoleDto.role === 'string') {
        const roleEntity = await this.accessControlService.findRoleByName(updateRoleDto.role);
        if (roleEntity) {
            roleId = roleEntity._id;
        }
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, { role: roleId }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async updateAgentStatus(id: string, status: string): Promise<UserDocument> {
    const previousUser = await this.userModel.findById(id).exec();
    if (!previousUser) {
      throw new NotFoundException("User not found");
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, { agentStatus: status }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // If approved, send the congratulatory email
    if (
      status === AgentStatus.APPROVED &&
      previousUser.agentStatus !== AgentStatus.APPROVED
    ) {
      this.notificationsService
        .sendAgentApprovalEmail(user.email, user.firstName)
        .catch((err) =>
          this.logger.error(
            `Failed to send Agent Approval email: ${err.message}`,
          ),
        );
    }

    return user;
  }

  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { refreshToken }).exec();
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { lastLogin: new Date() })
      .exec();
  }

  async setOTP(id: string, otp: string): Promise<void> {
    const otpValue = String(otp).trim();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await this.userModel.findByIdAndUpdate(id, {
      $set: {
        otp: otpValue,
        otpExpiry: expiry
      }
    }).exec();
    
    this.logger.debug(`[OTP-SET] Updated OTP for user ID: ${id}`);
  }

  async verifyOTP(email: string, otp: string): Promise<UserDocument | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = String(otp).trim();
    this.logger.debug(`[OTP-STRICT] Verifying ${normalizedOtp} for ${normalizedEmail}`);

    const user = await this.userModel
      .findOne({ email: normalizedEmail })
      .select("+otp +otpExpiry")
      .exec();

    if (!user) {
      this.logger.warn(`[OTP-STRICT] User not found: ${normalizedEmail}`);
      return null;
    }

    if (!user.otp || !user.otpExpiry) {
      this.logger.warn(`[OTP-STRICT] No OTP record for: ${normalizedEmail}`);
      return null;
    }

    // Check match first (trim both)
    if (String(user.otp).trim() !== normalizedOtp) {
      this.logger.warn(`[OTP-STRICT] Mismatch for ${normalizedEmail}. Expected "${user.otp}", got "${normalizedOtp}"`);
      return null;
    }

    // Check expiry with 5-minute grace period to account for clock drift
    const now = new Date();
    const graceExpiry = new Date(user.otpExpiry.getTime() + 5 * 60 * 1000); 
    
    if (now > graceExpiry) {
      this.logger.warn(`[OTP-STRICT] Expired for ${normalizedEmail}. Now: ${now}, Expiry: ${user.otpExpiry}`);
      return null;
    }

    // Success
    await this.userModel.findByIdAndUpdate(user._id, {
      $set: { isVerified: true, firstLogin: false },
      $unset: { otp: 1, otpExpiry: 1 }
    }).exec();

    this.logger.log(`[OTP-STRICT] SUCCESS: ${normalizedEmail}`);
    return this.findByEmail(normalizedEmail);
  }

  async setResetToken(email: string, token: string): Promise<void> {
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.userModel
      .findOneAndUpdate(
        { email: email.toLowerCase() },
        { resetToken: token, resetTokenExpiry: expiry },
      )
      .exec();
  }

  async findByResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: new Date() },
      })
      .select("+resetToken")
      .exec();
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await hashPassword(newPassword);
    await this.userModel
      .findByIdAndUpdate(userId, {
        password: hashedPassword,
        $unset: { resetToken: 1, resetTokenExpiry: 1 },
      })
      .exec();
  }

  async delete(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException("User not found");
    }
  }

  async getTenantUsers(
    tenantId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<UserDocument>> {
    return paginate(this.userModel, { tenant: tenantId }, paginationDto);
  }

  async countByRole(role: string): Promise<number> {
    return this.userModel.countDocuments({ role }).exec();
  }
  async updateKycStatus(
    id: string,
    docType: "idCard" | "selfie" | "cacCertificate",
    status: "approved" | "rejected",
    feedback?: string,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException("Agent not found");

    const updateField = `agentProfile.${docType}Status`;
    const updateData: any = { [updateField]: status };

    if (feedback) {
      updateData["agentProfile.kycFeedback"] = feedback;
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updatedUser) throw new NotFoundException("Failed to update KYC status");

    // Map internal docType to friendly name for email
    const friendlyNames = {
      idCard: "Identity Card",
      selfie: "Identity Selfie",
      cacCertificate: "Business Registration (CAC)",
    };

    // Trigger Email
    if (status === "approved") {
      this.notificationsService
        .sendKycDocumentApprovalEmail(
          updatedUser.email,
          updatedUser.firstName,
          friendlyNames[docType],
        )
        .catch((e) => this.logger.error(`KYC Approval Email Error: ${e.message}`));
    } else {
      this.notificationsService
        .sendKycDocumentRejectionEmail(
          updatedUser.email,
          updatedUser.firstName,
          friendlyNames[docType],
          feedback || "Document was not clear or did not meet our requirements.",
        )
        .catch((e) => this.logger.error(`KYC Rejection Email Error: ${e.message}`));
    }

    return updatedUser;
  }

  async saveDuffelCustomerId(userId: string, customerId: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(userId, { duffelCustomerId: customerId }, { new: true }).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  async findAdmins(): Promise<UserDocument[]> {
    // Resolve admin-level role IDs
    const superAdminRole = await this.accessControlService.findRoleByName('super_admin');
    const tenantAdminRole = await this.accessControlService.findRoleByName('tenant_admin');
    const staffRole = await this.accessControlService.findRoleByName('staff');

    const adminRoleIds = [
      superAdminRole?._id,
      tenantAdminRole?._id,
      staffRole?._id
    ].filter(id => !!id);

    return this.userModel.find({
      role: { $in: adminRoleIds },
      isActive: true
    })
    .select('firstName lastName avatar role email')
    .limit(10)
    .exec();
  }

  async syncAdminUser(email: string, password?: string, roleName?: string): Promise<void> {
    this.logger.log(`[SyncAdmin] Start for ${email}`);
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    const updateData: any = { 
      isActive: true, 
      isVerified: true,
      failedLoginAttempts: 0,
      lockUntil: null
    };
    
    if (password) {
      updateData.password = await hashPassword(password);
      this.logger.debug(`[SyncAdmin] Password update scheduled for ${email}`);
    }
    
    if (roleName) {
      const role = await this.accessControlService.findRoleByName(roleName);
      if (role) {
        updateData.role = role._id;
        this.logger.debug(`[SyncAdmin] Role assigned: ${roleName} (${role._id})`);
      } else {
        this.logger.warn(`[SyncAdmin] Role NOT found: ${roleName}`);
      }
    }

    if (user) {
      this.logger.log(`[SyncAdmin] Updating existing user: ${user._id}`);
      await this.userModel.findByIdAndUpdate(user._id, { $set: updateData });
    } else if (roleName && password) {
      this.logger.log(`[SyncAdmin] Creating new admin user: ${email}`);
      await this.create({
        email,
        password,
        firstName: "Admin",
        lastName: "User",
        role: roleName,
        isActive: true,
        isVerified: true,
        failedLoginAttempts: 0,
        lockUntil: null
      });
    }
    this.logger.log(`[SyncAdmin] Completed synchronization for ${email}`);
  }
}
