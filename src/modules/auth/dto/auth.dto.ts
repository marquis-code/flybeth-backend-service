// src/modules/auth/dto/auth.dto.ts
import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsEnum,
  IsObject,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Role } from "../../../common/constants/roles.constant";

export class RegisterDto {
  @ApiProperty({ example: "john@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "StrongP@ss1" })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: "John" })
  @IsString()
  firstName: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: "+1234567890" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: "Tenant ID for B2B registration" })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ enum: Role, default: Role.CUSTOMER })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: "MarquisTravels" })
  @IsOptional()
  @IsString()
  agencyName?: string;

  @ApiPropertyOptional({ example: "Independent OTA" })
  @IsOptional()
  @IsString()
  agencyType?: string;

  @ApiPropertyOptional({ example: "USD" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  // Agent Specific Fields
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idCardUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  selfieUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cacCertificateUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  llcDocsUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ein?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  bankAccountDetails?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billingAddress?: string;
}

export class LoginDto {
  @ApiProperty({ example: "john@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "StrongP@ss1" })
  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: "john@example.com" })
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
  @ApiProperty({ example: "john@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  otp: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  refreshToken: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: "john@example.com" })
  @IsEmail()
  @IsString()
  email: string;
}
