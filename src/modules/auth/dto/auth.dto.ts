// src/modules/auth/dto/auth.dto.ts
import {
    IsString,
    IsEmail,
    MinLength,
    IsOptional,
    IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/constants/roles.constant';

export class RegisterDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'StrongP@ss1' })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({ example: 'John' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    lastName: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ description: 'Tenant ID for B2B registration' })
    @IsOptional()
    @IsString()
    tenantId?: string;

    @ApiPropertyOptional({ enum: Role, default: Role.CUSTOMER })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @ApiPropertyOptional({ example: 'USD' })
    @IsOptional()
    @IsString()
    currency?: string;
}

export class LoginDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'StrongP@ss1' })
    @IsString()
    password: string;
}

export class ForgotPasswordDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty()
    @IsString()
    token: string;

    @ApiProperty()
    @IsString()
    @MinLength(8)
    newPassword: string;
}

export class VerifyOtpDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    otp: string;
}

export class RefreshTokenDto {
    @ApiProperty()
    @IsString()
    refreshToken: string;
}
