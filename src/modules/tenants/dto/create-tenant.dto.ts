// src/modules/tenants/dto/create-tenant.dto.ts
import {
    IsString,
    IsEmail,
    IsOptional,
    IsNumber,
    Min,
    Max,
    IsArray,
    IsBoolean,
    IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
    @ApiProperty({ example: 'Skyline Travel Agency' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'skyline-travel' })
    @IsString()
    slug: string;

    @ApiPropertyOptional({ example: 'skylinetravel.com' })
    @IsOptional()
    @IsString()
    domain?: string;

    @ApiProperty({ example: 'admin@skylinetravel.com' })
    @IsEmail()
    contactEmail: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsOptional()
    @IsString()
    contactPhone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    logo?: string;

    @ApiPropertyOptional({ example: 'USD' })
    @IsOptional()
    @IsString()
    defaultCurrency?: string;

    @ApiPropertyOptional({ example: ['USD', 'EUR', 'GBP'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    supportedCurrencies?: string[];

    @ApiPropertyOptional({ example: 5 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    markupPercentage?: number;

    @ApiPropertyOptional({ example: 2 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    commissionPercentage?: number;
}

export class UpdateTenantDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    domain?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    contactEmail?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    contactPhone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    logo?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    defaultCurrency?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    supportedCurrencies?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    markupPercentage?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    commissionPercentage?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    allowB2C?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    allowB2B?: boolean;
}

export class UpdateTenantStatusDto {
    @ApiProperty({ enum: ['active', 'suspended', 'pending'] })
    @IsEnum(['active', 'suspended', 'pending'])
    status: string;
}
