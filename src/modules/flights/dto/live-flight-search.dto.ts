// src/modules/flights/dto/live-flight-search.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class LiveFlightSearchDto {
  @ApiProperty({
    example: "LHR",
    description: "Origin airport IATA code",
  })
  @IsString()
  origin: string;

  @ApiProperty({
    example: "JFK",
    description: "Destination airport IATA code",
  })
  @IsString()
  destination: string;

  @ApiProperty({ example: "2026-06-15" })
  @IsDateString()
  departureDate: string;

  @ApiPropertyOptional({ example: "2026-06-22" })
  @IsOptional()
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
}
