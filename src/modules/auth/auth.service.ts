// src/modules/auth/auth.service.ts
import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import {
    RegisterDto,
    LoginDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    VerifyOtpDto,
} from './dto/auth.dto';
import { comparePassword, generateOTP } from '../../common/utils/crypto.util';
import { Role } from '../../common/constants/roles.constant';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async register(registerDto: RegisterDto) {
        const user = await this.usersService.create({
            email: registerDto.email,
            password: registerDto.password,
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            phone: registerDto.phone,
            role: registerDto.role || Role.CUSTOMER,
            tenant: registerDto.tenantId ? (registerDto.tenantId as any) : null,
            preferences: {
                currency: registerDto.currency || 'USD',
                language: 'en',
                emailNotifications: true,
                pushNotifications: true,
            },
        });

        // Generate OTP for email verification
        const otp = generateOTP();
        await this.usersService.setOTP(user._id.toString(), otp);

        this.logger.log(`User registered: ${user.email} (Role: ${user.role})`);

        // Generate tokens
        const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);

        return {
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isVerified: user.isVerified,
            },
            otp, // In production, send via email/SMS instead
            ...tokens,
        };
    }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findByEmail(loginDto.email, true);

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        const isPasswordValid = await comparePassword(
            loginDto.password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Update last login
        await this.usersService.updateLastLogin(user._id.toString());

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

        this.logger.log(`User logged in: ${user.email}`);

        return {
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                tenant: user.tenant,
                isVerified: user.isVerified,
                preferences: user.preferences,
            },
            ...tokens,
        };
    }

    async refreshToken(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
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
            return { message: 'If this email exists, a reset link will be sent' };
        }

        const resetToken = uuidv4();
        await this.usersService.setResetToken(user.email, resetToken);

        this.logger.log(`Password reset requested for: ${user.email}`);

        // In production, send reset email with token
        return {
            message: 'Password reset link sent to your email',
            resetToken, // Remove in production, send via email
        };
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const user = await this.usersService.findByResetToken(
            resetPasswordDto.token,
        );

        if (!user) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        await this.usersService.resetPassword(
            user._id.toString(),
            resetPasswordDto.newPassword,
        );

        this.logger.log(`Password reset completed for: ${user.email}`);

        return { message: 'Password has been reset successfully' };
    }

    async verifyOtp(verifyOtpDto: VerifyOtpDto) {
        const user = await this.usersService.verifyOTP(
            verifyOtpDto.email,
            verifyOtpDto.otp,
        );

        if (!user) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        this.logger.log(`Email verified for: ${user.email}`);

        return { message: 'Email verified successfully', isVerified: true };
    }

    async logout(userId: string) {
        await this.usersService.updateRefreshToken(userId, null);
        return { message: 'Logged out successfully' };
    }

    private async generateTokens(
        userId: string,
        email: string,
        role: string,
    ) {
        const payload = { sub: userId, email, role };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload as any),
            this.jwtService.signAsync(payload as any, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret',
                expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d') as any,
            }),
        ]);

        return { accessToken, refreshToken };
    }
}
