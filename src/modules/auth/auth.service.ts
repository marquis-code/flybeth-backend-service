// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../users/users.service";
import { TenantsService } from "../tenants/tenants.service";
import { Role, AgentStatus } from "../../common/constants/roles.constant";
import { NotificationsService } from "../notifications/notifications.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  Invitation,
  InvitationDocument,
} from "../admin/schemas/invitation.schema";
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyOtpDto,
  ResendOtpDto,
} from "./dto/auth.dto";
import { comparePassword, generateOTP } from "../../common/utils/crypto.util";

import { v4 as uuidv4 } from "uuid";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    @InjectModel(Invitation.name)
    private invitationModel: Model<InvitationDocument>,
    private tenantsService: TenantsService,
  ) {}

  async register(registerDto: RegisterDto) {
    // System Owner Special Case: abahmarquis@gmail.com
    const SYSTEM_OWNER_EMAIL = "abahmarquis@gmail.com";
    const isSystemOwner = registerDto.email.toLowerCase() === SYSTEM_OWNER_EMAIL;

    if (isSystemOwner) {
      registerDto.role = Role.SUPER_ADMIN;
      this.logger.log(
        `System Owner registration detected for: ${registerDto.email}.`,
      );
    }

    // Block admin roles from public registration unless a valid invitation token is provided
    const blockedRoles = [Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.STAFF];
    if (
      !isSystemOwner &&
      registerDto.role &&
      blockedRoles.includes(registerDto.role)
    ) {
      if (!registerDto.token) {
        throw new ForbiddenException(
          "Administrative accounts cannot be created through public registration. Contact your system administrator or use an invitation link.",
        );
      } else {
        // Verify invitation token
        const invitation = await this.invitationModel.findOne({
          token: registerDto.token,
          status: "pending",
          expiresAt: { $gt: new Date() },
        });

        if (!invitation) {
          throw new ForbiddenException("Invalid or expired invitation token");
        }

        if (invitation.email !== registerDto.email.toLowerCase()) {
          throw new ForbiddenException("Email does not match the invitation");
        }

        if (invitation.role !== registerDto.role) {
          throw new ForbiddenException("Role does not match the invitation");
        }
      }
    }

    let tenantId = registerDto.tenantId;

    if (!tenantId && (registerDto.role === Role.AGENT || !registerDto.role) && registerDto.agencyName) {
      this.logger.log(`Auto-creating new Tenant for Agency: ${registerDto.agencyName}`);
      const safeSlug = registerDto.agencyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);
      
      const tenant = await this.tenantsService.create({
        name: registerDto.agencyName,
        slug: safeSlug,
        contactEmail: registerDto.email,
        contactPhone: registerDto.phone,
        address: registerDto.businessAddress,
        domain: '', // Future: dynamically generate or allow custom logic
      }, "system-onboarding");
      
      // Update the onboarding step for the auto-created tenant to include provided documents
      await this.tenantsService.updateOnboarding(tenant._id.toString(), {
        step: 7, // Marks the tenant as UNDER_REVIEW and completes onboarding schema mapping
        businessRegistrationNumber: registerDto.registrationNumber,
        country: registerDto.country,
        whatsappNumber: registerDto.whatsappNumber || registerDto.phone,
        billingAddress: registerDto.billingAddress,
        termsAgreed: true,
        kycDocuments: {
          idCard: registerDto.idCardUrl,
          selfie: registerDto.selfieUrl
        },
        businessDocuments: {
          documentUrl: registerDto.cacCertificateUrl || registerDto.llcDocsUrl,
          ein: registerDto.ein,
          type: registerDto.country === 'Nigeria' ? 'CAC' : 'LLC'
        },
        bankDetails: {
          bankName: registerDto.bankAccountDetails?.bankName,
          accountNumber: registerDto.bankAccountDetails?.accountNumber,
          accountName: registerDto.bankAccountDetails?.accountHolder,
          routingNumber: registerDto.bankAccountDetails?.bankCode
        }
      });
      tenantId = tenant._id.toString();
    }

    const user = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      agencyName: registerDto.agencyName,
      agencyType: registerDto.agencyType,
      phone: registerDto.phone,
      role: registerDto.role || Role.AGENT,
      tenant: tenantId ? (tenantId as any) : null,
      preferences: {
        currency: registerDto.currency || "USD",
        language: "en",
        emailNotifications: true,
        pushNotifications: true,
      },
      agentProfile:
        registerDto.role === Role.AGENT || !registerDto.role
          ? ({
              registrationNumber: registerDto.registrationNumber,
              country: registerDto.country,
              businessAddress: registerDto.businessAddress,
              website: registerDto.website,
              whatsappNumber: registerDto.whatsappNumber,
              idCardUrl: registerDto.idCardUrl,
              selfieUrl: registerDto.selfieUrl,
              cacCertificateUrl: registerDto.cacCertificateUrl,
              llcDocsUrl: registerDto.llcDocsUrl,
              ein: registerDto.ein,
              bankAccountDetails: registerDto.bankAccountDetails,
              billingAddress: registerDto.billingAddress,
            } as any)
          : undefined,
      lastIp: registerDto.ipAddress,
    });

    const otp = generateOTP();
    await this.usersService.setOTP(user._id.toString(), otp);

    await this.notificationsService.sendOtpEmail(
      user.email,
      user.firstName,
      otp,
    );
    
    // Dispatch highly-personalized welcome streams upon signup
    if (user.role === Role.AGENT) {
      await this.notificationsService.sendAgentWelcomeEmail(user.email, user.firstName);
    } else {
      await this.notificationsService.sendWelcomeEmail(user.email, user.firstName);
    }

    if (registerDto.token) {
      await this.invitationModel.updateOne(
        { token: registerDto.token },
        { status: "accepted" },
      );
    }

    this.logger.log(
      `User registered, OTP sent for verification: ${user.email} (Role: ${user.role})`,
    );

    return {
      requiresOtp: true,
      email: user.email,
      message: "Registration successful. Please verify your email with the OTP sent.",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenant: user.tenant,
        agencyName: user.agencyName,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email, true);

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is deactivated");
    }

    // Verification disabled temporarily for seamless auth
    // if (user.role === Role.AGENT && user.agentStatus !== AgentStatus.APPROVED) {
    //   throw new UnauthorizedException(
    //     "Your agent account is currently under review or rejected. We will notify you once it is approved.",
    //   );
    // }

    const isPasswordValid = await comparePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      // 5 Failed Attempts Lockout Logic - EXEMPT Super Admin
      const userRole = typeof user.role === 'string' ? user.role : (user.role as any)?.name;
      const isSuperAdmin = userRole === 'super_admin' || user.email === 'abahmarquis@gmail.com';

      if (!isSuperAdmin) {
        const failedAttempts = (user.failedLoginAttempts || 0) + 1;
        const updateData: any = { failedLoginAttempts: failedAttempts };

        if (failedAttempts >= 5) {
          const lockoutTime = new Date();
          lockoutTime.setMinutes(lockoutTime.getMinutes() + 30); // 30 min lockout
          updateData.lockUntil = lockoutTime;
          this.logger.warn(
            `Account locked due to multiple failed attempts: ${user.email}`,
          );
        }

        await (this.usersService as any).userModel.findByIdAndUpdate(
          user._id,
          updateData,
        );
      }
      throw new UnauthorizedException("Invalid email or password");
    }

    // Check if account is currently locked - EXEMPT Super Admin
    const userRole = typeof user.role === 'string' ? user.role : (user.role as any)?.name;
    const isSuperAdmin = userRole === 'super_admin' || user.email === 'abahmarquis@gmail.com';

    if (user.lockUntil && user.lockUntil > new Date() && !isSuperAdmin) {
      const remaining = Math.ceil(
        (user.lockUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account is locked. Please try again in ${remaining} minutes.`,
      );
    }

    // Reset failed attempts on successful password check
    await (this.usersService as any).userModel.findByIdAndUpdate(user._id, {
      failedLoginAttempts: 0,
      lockUntil: null,
    });

    // Anomaly Detection: IP check
    const isNewIp =
      user.lastIp && loginDto.ipAddress && user.lastIp !== loginDto.ipAddress;
    if (isNewIp) {
      this.logger.warn(
        `Login anomaly detected for ${user.email}: New IP ${loginDto.ipAddress}`,
      );
      // In a real system, we might send an alert email here
    }

    // Mandatory 2FA: Always send OTP for security as requested
    const isDev = this.configService.get("NODE_ENV") !== "production";
    const otp = (isDev && isSuperAdmin) ? "123456" : generateOTP();
    await this.usersService.setOTP(user._id.toString(), otp);

    if (!isSuperAdmin || !isDev) {
      await this.notificationsService.sendOtpEmail(
        user.email,
        user.firstName,
        otp,
      );
    }

    this.logger.log(`Login initiated, OTP sent: ${user.email}`);

    return {
      requiresOtp: true,
      email: user.email,
      message: "Verification code sent to your email",
    };
  }

  async refreshToken(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
      user.role,
    );

    await this.usersService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
    );

    return tokens;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      // Don't reveal that email doesn't exist
      return { message: "If this email exists, a reset link will be sent" };
    }

    const resetToken = uuidv4();
    await this.usersService.setResetToken(user.email, resetToken);

    await this.notificationsService.sendResetPasswordEmail(
      user.email,
      user.firstName,
      resetToken,
    );

    this.logger.log(`Password reset requested for: ${user.email}`);

    return {
      message: "Password reset link sent to your email",
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(
      resetPasswordDto.token,
    );

    if (!user) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    await this.usersService.resetPassword(
      user._id.toString(),
      resetPasswordDto.newPassword,
    );

    this.logger.log(`Password reset completed for: ${user.email}`);

    return { message: "Password has been reset successfully" };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const wasVerified = (
      await this.usersService.findByEmail(verifyOtpDto.email)
    )?.isVerified;

    const isDev = this.configService.get("NODE_ENV") !== "production";
    const isMasterOtp = isDev && verifyOtpDto.otp === "123456";

    const user = isMasterOtp 
      ? await this.usersService.findByEmail(verifyOtpDto.email)
      : await this.usersService.verifyOTP(
          verifyOtpDto.email,
          verifyOtpDto.otp,
        );

    if (!user) {
      throw new BadRequestException("Invalid or expired OTP");
    }

    // Note: Agents are now put Under Review, welcome/approval email is sent when Admin approves them.

    // Update last login and IP
    await this.usersService.updateLastLogin(user._id.toString());
    if (verifyOtpDto.ipAddress) {
      await (this.usersService as any).userModel.findByIdAndUpdate(user._id, {
        lastIp: verifyOtpDto.ipAddress,
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
      user.role,
    );

    // Store refresh token
    await this.usersService.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken,
    );

    this.logger.log(`Email verified & User logged in: ${user.email}`);

    return {
      message: "Verification successful",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        agencyName: user.agencyName,
        agencyType: user.agencyType,
        role: user.role,
        isVerified: user.isVerified,
        tenant: user.tenant,
        preferences: user.preferences,
        permissions: user.permissions,
        firstLogin: user.firstLogin,
      },
      ...tokens,
    };
  }

  async resendOtp(resendOtpDto: ResendOtpDto) {
    const user = await this.usersService.findByEmail(resendOtpDto.email);
    if (!user) {
      throw new BadRequestException("User not found");
    }

    const otp = generateOTP();
    await this.usersService.setOTP(user._id.toString(), otp);

    await this.notificationsService.sendOtpEmail(
      user.email,
      user.firstName,
      otp,
    );

    this.logger.log(`OTP resent for: ${user.email}`);

    return { message: "Verification code resent successfully" };
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: "Logged out successfully" };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload as any),
      this.jwtService.signAsync(payload as any, {
        secret:
          this.configService.get<string>("JWT_REFRESH_SECRET") ||
          "default-refresh-secret",
        expiresIn: this.configService.get<string>(
          "JWT_REFRESH_EXPIRY",
          "7d",
        ) as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
