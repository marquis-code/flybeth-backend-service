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
import { NotificationsService } from "../notifications/notifications.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Invitation, InvitationDocument } from "../admin/schemas/invitation.schema";
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyOtpDto,
  ResendOtpDto,
} from "./dto/auth.dto";
import { comparePassword, generateOTP } from "../../common/utils/crypto.util";
import { Role } from "../../common/constants/roles.constant";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    @InjectModel(Invitation.name) private invitationModel: Model<InvitationDocument>,
  ) {}

  async register(registerDto: RegisterDto) {
    // Block admin roles from public registration unless a valid invitation token is provided
    const blockedRoles = [Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.STAFF];
    if (registerDto.role && blockedRoles.includes(registerDto.role)) {
      const isSuperAdminSignup = registerDto.role === Role.SUPER_ADMIN;
      const superAdminCount = isSuperAdminSignup 
        ? await this.usersService.countByRole(Role.SUPER_ADMIN) 
        : 0;

      const masterToken = this.configService.get("ADMIN_REGISTRATION_TOKEN");
      const isMasterToken = registerDto.token && registerDto.token === masterToken;

      if (!registerDto.token) {
        // Exception: Allow first Super Admin to register without a token
        if (isSuperAdminSignup && superAdminCount === 0) {
          this.logger.log(`Initial Super Admin registration allowed for: ${registerDto.email}`);
        } else {
          throw new ForbiddenException(
            "Administrative accounts cannot be created through public registration. Contact your system administrator or use an invitation link.",
          );
        }
      } else if (!isMasterToken) {
        // Verify invitation token only if it's not the master token
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
      } else {
        this.logger.log(`Administrative registration using Master Token allowed for: ${registerDto.email} (Role: ${registerDto.role})`);
      }
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
      tenant: registerDto.tenantId ? (registerDto.tenantId as any) : null,
      preferences: {
        currency: registerDto.currency || "USD",
        language: "en",
        emailNotifications: true,
        pushNotifications: true,
      },
      agentProfile: (registerDto.role === Role.AGENT || !registerDto.role) ? {
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
      } as any : undefined,
      lastIp: registerDto.ipAddress,
    });

    const otp = generateOTP();
    await this.usersService.setOTP(user._id.toString(), otp);

    this.notificationsService
      .sendOtpEmail(user.email, user.firstName, otp)
      .catch((err) => {
        this.logger.error(
          `Failed to send OTP email to ${user.email}: ${err.message}`,
        );
      });

    if (user.role === Role.AGENT) {
      this.notificationsService
        .sendAgentSignupUnderReviewEmail(user.email, user.firstName)
        .catch((err) => {
          this.logger.error(`Failed to send Agent Under Review email: ${err.message}`);
        });
    }

    if (registerDto.token) {
      await this.invitationModel.updateOne(
        { token: registerDto.token },
        { status: "accepted" },
      );
    }

    this.logger.log(
      `User registered and OTP sent: ${user.email} (Role: ${user.role})`,
    );

    return {
      requiresOtp: true,
      message: "Registration successful. A verification code has been sent to your email.",
      email: user.email,
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

    const isPasswordValid = await comparePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Instead of logging in immediately, send OTP for 2FA
    const otp = generateOTP();
    await this.usersService.setOTP(user._id.toString(), otp);

    this.notificationsService
      .sendOtpEmail(user.email, user.firstName, otp)
      .catch((err) => {
        this.logger.error(
          `Failed to send login OTP to ${user.email}: ${err.message}`,
        );
      });

    this.logger.log(`Login OTP sent for: ${user.email}`);

    return {
      requiresOtp: true,
      message: "Verification code sent to your email",
      email: user.email,
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
    const wasVerified = (await this.usersService.findByEmail(verifyOtpDto.email))
      ?.isVerified;

    const user = await this.usersService.verifyOTP(
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
      await (this.usersService as any).userModel.findByIdAndUpdate(user._id, { lastIp: verifyOtpDto.ipAddress });
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

    await this.notificationsService.sendOtpEmail(user.email, user.firstName, otp);

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
