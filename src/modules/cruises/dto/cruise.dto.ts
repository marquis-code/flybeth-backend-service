// src/modules/cruises/dto/cruise.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchCruisesDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    destination?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    departureMonth?: string; // Format: "YYYY-MM"

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    minNights?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    maxNights?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    cruiseLine?: string;
}

export class CreateCruiseDto {
    @IsString()
    name: string;

    @IsString()
    destination: string;

    @IsString()
    cruiseLine: string;

    @IsString()
    departurePort: string;

    @IsDateString()
    departureDate: string;

    @IsNumber()
    durationNights: number;

    @Type(() => Array)
    cabinClasses: {
        type: string;
        price: number;
        availability: number;
    }[];

    @IsOptional()
    @IsString({ each: true })
    images?: string[];

    @IsOptional()
    @IsString()
    description?: string;
}
