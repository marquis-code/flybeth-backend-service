// src/modules/passengers/dto/passenger.dto.ts
import {
    IsString,
    IsOptional,
    IsEmail,
    IsDateString,
    IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePassengerDto {
    @ApiProperty({ example: 'John' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    lastName: string;

    @ApiPropertyOptional({ example: '1990-05-15' })
    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;

    @ApiPropertyOptional({ enum: ['male', 'female', 'other'] })
    @IsOptional()
    @IsEnum(['male', 'female', 'other'])
    gender?: string;

    @ApiPropertyOptional({ example: 'US' })
    @IsOptional()
    @IsString()
    nationality?: string;

    @ApiPropertyOptional({ example: 'A12345678' })
    @IsOptional()
    @IsString()
    passportNumber?: string;

    @ApiPropertyOptional({ example: '2030-05-15' })
    @IsOptional()
    @IsDateString()
    passportExpiry?: string;

    @ApiPropertyOptional({ example: 'US' })
    @IsOptional()
    @IsString()
    passportCountry?: string;

    @ApiPropertyOptional({ example: 'john@example.com' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ enum: ['adult', 'child', 'infant'], default: 'adult' })
    @IsOptional()
    @IsEnum(['adult', 'child', 'infant'])
    type?: string;
}

export class UpdatePassengerDto extends CreatePassengerDto { }
