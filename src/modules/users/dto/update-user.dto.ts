// src/modules/users/dto/update-user.dto.ts
import {
    IsString,
    IsOptional,
    IsEmail,
    IsEnum,
    IsBoolean,
    IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/constants/roles.constant';

export class UpdateUserDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    avatar?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    language?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    emailNotifications?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    pushNotifications?: boolean;
}

export class UpdateUserRoleDto {
    @ApiPropertyOptional({ enum: Role })
    @IsEnum(Role)
    role: Role;
}

export class UserQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    tenant?: string;

    @ApiPropertyOptional({ enum: Role })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
