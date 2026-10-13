// src/modules/cars/dto/car.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BadRequestException } from "@nestjs/common";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * Pickup/drop-off may arrive under the canonical camelCase (`pickUpLocation`)
 * or the looser `pickupLocation` spelling, because different search widgets
 * used different names. Both are declared here and normalised by `normalize()`
 * before the service reads them.
 */
export class SearchCarsDto {
  @ApiPropertyOptional({ enum: ["rental", "ride"], default: "rental" })
  @IsOptional()
  @IsEnum(["rental", "ride"])
  type?: string;

  // ── Canonical spelling ────────────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickUpLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dropOffLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  pickUpDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dropOffDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickUpTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dropOffTime?: string;

  // ── Lenient spelling ──────────────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dropoffLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  pickupDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dropoffDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dropoffTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  passengers?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  driverAge?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverCountryCode?: string;
}

/**
 * Collapses the two supported spellings into one normalised shape and validates
 * that the two required search fields are actually present.
 */
export function normalizeCarSearch(dto: SearchCarsDto): {
  type: string;
  pickUpLocation: string;
  dropOffLocation?: string;
  pickUpDate: string;
  dropOffDate?: string;
  pickUpTime?: string;
  dropOffTime?: string;
  category?: string;
  currency?: string;
  passengers?: number;
  driverAge?: number;
  driverCountryCode?: string;
} {
  const pickUpLocation = dto.pickUpLocation || dto.pickupLocation;
  const pickUpDate = dto.pickUpDate || dto.pickupDate;

  if (!pickUpLocation) {
    throw new BadRequestException("pickUpLocation is required");
  }
  if (!pickUpDate) {
    throw new BadRequestException("pickUpDate is required");
  }

  return {
    type: (dto.type || "rental").toLowerCase(),
    pickUpLocation,
    dropOffLocation: dto.dropOffLocation || dto.dropoffLocation,
    pickUpDate,
    dropOffDate: dto.dropOffDate || dto.dropoffDate,
    pickUpTime: dto.pickUpTime || dto.pickupTime,
    dropOffTime: dto.dropOffTime || dto.dropoffTime,
    category: dto.category,
    currency: dto.currency,
    passengers: dto.passengers,
    driverAge: dto.driverAge,
    driverCountryCode: dto.driverCountryCode,
  };
}

export class CreateCarDto {
  @IsString()
  name: string;

  @IsEnum(["rental", "ride"])
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
    transmission?: "automatic" | "manual";
    fuelType?: "petrol" | "diesel" | "electric" | "hybrid";
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

export class CreateCarQuoteDto {
  @ApiProperty()
  @IsString()
  rateId: string;
}

export class CarDriverDto {
  @ApiProperty()
  @IsString()
  userId?: string;

  @ApiProperty()
  @IsString()
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  givenName: string;

  @ApiProperty()
  @IsString()
  familyName: string;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsDateString()
  dateOfBirth: string;
}

export class BookCarDto {
  @ApiProperty()
  @IsString()
  quoteId: string;

  @ApiProperty()
  @Type(() => CarDriverDto)
  driver: CarDriverDto;
}

