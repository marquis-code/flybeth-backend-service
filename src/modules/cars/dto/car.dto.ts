// src/modules/cars/dto/car.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchCarsDto {
    @ApiProperty({ enum: ['rental', 'ride'] })
    @IsEnum(['rental', 'ride'])
    type: string;

    @ApiProperty()
    @IsString()
    pickUpLocation: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    dropOffLocation?: string;

    @ApiProperty()
    @IsDateString()
    pickUpDate: string;

    @ApiProperty()
    @IsDateString()
    dropOffDate: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    pickUpTime?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    dropOffTime?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    passengers?: number;
}

export class CreateCarDto {
    @IsString()
    name: string;

    @IsEnum(['rental', 'ride'])
    type: string;

    @IsString()
    vendor: string;

    @IsString()
    category: string;

    @Type(() => Object)
    capacity: {
        passengers: number;
        luggage: number;
    };

    @IsOptional()
    @Type(() => Object)
    specifications?: {
        transmission?: 'automatic' | 'manual';
        fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid';
        airConditioning?: boolean;
        doors?: number;
    };

    @Type(() => Object)
    pricing: {
        baseRate: number;
        currency: string;
    };

    @IsOptional()
    @IsString({ each: true })
    availableLocations: string[];
}
