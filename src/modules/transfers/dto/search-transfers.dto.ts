// src/modules/transfers/dto/search-transfers.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SearchTransfersDto {
  @ApiProperty({ example: "CDG", description: "IATA code for start location" })
  @IsString()
  startLocationCode: string;

  @ApiPropertyOptional({ example: "123 Main St, Paris" })
  @IsOptional()
  @IsString()
  endAddressLine?: string;

  @ApiPropertyOptional({ example: "Paris" })
  @IsOptional()
  @IsString()
  endCityName?: string;

  @ApiPropertyOptional({ example: "75001" })
  @IsOptional()
  @IsString()
  endZipCode?: string;

  @ApiPropertyOptional({ example: "FR" })
  @IsOptional()
  @IsString()
  endCountryCode?: string;

  @ApiPropertyOptional({ example: "48.8566,2.3522", description: "lat,long" })
  @IsOptional()
  @IsString()
  endGeoCode?: string;

  @ApiProperty({ example: "2026-05-08T10:00:00", description: "ISO DateTime" })
  @IsDateString()
  startDateTime: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  passengers: number;

  @ApiPropertyOptional({
    example: "PRIVATE",
    enum: ["PRIVATE", "SHARED", "ALL"],
  })
  @IsOptional()
  @IsString()
  transferType?: "PRIVATE" | "SHARED" | "ALL";
}
