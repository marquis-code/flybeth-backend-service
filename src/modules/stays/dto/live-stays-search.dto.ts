// src/modules/stays/dto/live-stays-search.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class GuestDto {
  @ApiProperty({ example: "adult", enum: ["adult", "child"] })
  @IsString()
  type: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  age?: number;
}

class LocationDto {
  @ApiProperty({ example: 51.5071 })
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -0.1416 })
  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 5, description: "Radius in km" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  radius?: number;
}

export class LiveStaysSearchDto {
  @ApiPropertyOptional({ type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({
    example: "acc_0000AWr2VsUNIF1Vl91xg0",
    description: "Search by specific accommodation ID",
  })
  @IsOptional()
  @IsString()
  accommodationId?: string;

  @ApiProperty({ example: "2026-06-15" })
  @IsDateString()
  checkInDate: string;

  @ApiProperty({ example: "2026-06-18" })
  @IsDateString()
  checkOutDate: string;

  @ApiProperty({
    type: [GuestDto],
    example: [{ type: "adult" }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestDto)
  guests: GuestDto[];

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  rooms?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  freeCancellationOnly?: boolean;
}

export class FetchRatesDto {
  @ApiProperty({ example: "srr_0000ASVBuJVLdmqtZDJ4ca" })
  @IsString()
  searchResultId: string;

  @ApiProperty({ example: "duffel" })
  @IsString()
  provider: string;

  @ApiPropertyOptional({ example: "2026-06-15" })
  @IsOptional()
  @IsDateString()
  checkInDate?: string;

  @ApiPropertyOptional({ example: "2026-06-18" })
  @IsOptional()
  @IsDateString()
  checkOutDate?: string;

  @ApiPropertyOptional({ type: [GuestDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestDto)
  guests?: GuestDto[];

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rooms?: number;

  @ApiPropertyOptional({ example: "2026-03-04" })
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiPropertyOptional({ example: "2026-03-05" })
  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  adults?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  children?: number;
}

export class CreateQuoteDto {
  @ApiProperty({ example: "rat_0000BTVRuKZTavzrZDJ4cb" })
  @IsString()
  rateId: string;

  @ApiProperty({ example: "duffel" })
  @IsString()
  provider: string;
}
