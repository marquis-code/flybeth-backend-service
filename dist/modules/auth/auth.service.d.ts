import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, VerifyOtpDto } from './dto/auth.dto';
import { Role } from '../../common/constants/roles.constant';
export declare class AuthService {
    private usersService;
    private jwtService;
    private configService;
    private readonly logger;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            email: string;
            firstName: string;
            lastName: string;
            role: Role;
            isVerified: boolean;
        };
        otp: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            email: string;
            firstName: string;
            lastName: string;
            role: Role;
            tenant: import("mongoose").Types.ObjectId;
            isVerified: boolean;
            preferences: import("../users/schemas/user.schema").UserPreferences;
        };
    }>;
    refreshToken(userId: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
        resetToken?: undefined;
    } | {
        message: string;
        resetToken: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
        message: string;
        isVerified: boolean;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    private generateTokens;
}
