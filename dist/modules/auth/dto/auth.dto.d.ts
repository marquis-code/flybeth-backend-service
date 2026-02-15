import { Role } from '../../../common/constants/roles.constant';
export declare class RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    tenantId?: string;
    role?: Role;
    currency?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
export declare class VerifyOtpDto {
    email: string;
    otp: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
