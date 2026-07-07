// src/modules/flights/dto/live-flight-search.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  ValidateIf,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class LiveFlightSearchDto {
  @ApiPropertyOptional({
    example: "LHR",
    description: "Origin airport IATA code (optional if slices provided)",
  })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({
    example: "JFK",
    description: "Destination airport IATA code (optional if slices provided)",
  })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiPropertyOptional({ example: "2026-06-15" })
  @IsOptional()
  @IsDateString()
  departureDate?: string;

  @ApiPropertyOptional({
    description: "Array of slices for multi-city search. Overrides origin/destination/departureDate",
    example: [{ origin: "LHR", destination: "JFK", departureDate: "2026-06-15" }]
  })
  @IsOptional()
  slices?: { origin: string; destination: string; departureDate: string }[];

  @ApiPropertyOptional({ example: "2026-06-22" })
  @IsOptional()
  @ValidateIf((object, value) => value !== "")
  @IsDateString()
  returnDate?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  adults?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  children?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  infants?: number;

  @ApiPropertyOptional({
    example: "economy",
    enum: ["economy", "premium_economy", "business", "first"],
  })
  @IsOptional()
  @IsString()
  cabinClass?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Max stops (0 = direct only)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxStops?: number;
  @ApiPropertyOptional({
    description: "User role for commission calculation",
  })
  @IsOptional()
  @IsString()
  userRole?: string;
}
