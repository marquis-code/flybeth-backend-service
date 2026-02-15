"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const users_service_1 = require("../users/users.service");
const crypto_util_1 = require("../../common/utils/crypto.util");
const roles_constant_1 = require("../../common/constants/roles.constant");
const uuid_1 = require("uuid");
let AuthService = AuthService_1 = class AuthService {
    constructor(usersService, jwtService, configService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async register(registerDto) {
        const user = await this.usersService.create({
            email: registerDto.email,
            password: registerDto.password,
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            phone: registerDto.phone,
            role: registerDto.role || roles_constant_1.Role.CUSTOMER,
            tenant: registerDto.tenantId ? registerDto.tenantId : null,
            preferences: {
                currency: registerDto.currency || 'USD',
                language: 'en',
                emailNotifications: true,
                pushNotifications: true,
            },
        });
        const otp = (0, crypto_util_1.generateOTP)();
        await this.usersService.setOTP(user._id.toString(), otp);
        this.logger.log(`User registered: ${user.email} (Role: ${user.role})`);
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
            otp,
            ...tokens,
        };
    }
    async login(loginDto) {
        const user = await this.usersService.findByEmail(loginDto.email, true);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is deactivated');
        }
        const isPasswordValid = await (0, crypto_util_1.comparePassword)(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        await this.usersService.updateLastLogin(user._id.toString());
        const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);
        await this.usersService.updateRefreshToken(user._id.toString(), tokens.refreshToken);
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
    async refreshToken(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);
        await this.usersService.updateRefreshToken(user._id.toString(), tokens.refreshToken);
        return tokens;
    }
    async forgotPassword(forgotPasswordDto) {
        const user = await this.usersService.findByEmail(forgotPasswordDto.email);
        if (!user) {
            return { message: 'If this email exists, a reset link will be sent' };
        }
        const resetToken = (0, uuid_1.v4)();
        await this.usersService.setResetToken(user.email, resetToken);
        this.logger.log(`Password reset requested for: ${user.email}`);
        return {
            message: 'Password reset link sent to your email',
            resetToken,
        };
    }
    async resetPassword(resetPasswordDto) {
        const user = await this.usersService.findByResetToken(resetPasswordDto.token);
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        await this.usersService.resetPassword(user._id.toString(), resetPasswordDto.newPassword);
        this.logger.log(`Password reset completed for: ${user.email}`);
        return { message: 'Password has been reset successfully' };
    }
    async verifyOtp(verifyOtpDto) {
        const user = await this.usersService.verifyOTP(verifyOtpDto.email, verifyOtpDto.otp);
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired OTP');
        }
        this.logger.log(`Email verified for: ${user.email}`);
        return { message: 'Email verified successfully', isVerified: true };
    }
    async logout(userId) {
        await this.usersService.updateRefreshToken(userId, null);
        return { message: 'Logged out successfully' };
    }
    async generateTokens(userId, email, role) {
        const payload = { sub: userId, email, role };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET') || 'default-refresh-secret',
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRY', '7d'),
            }),
        ]);
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map