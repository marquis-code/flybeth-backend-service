// src/modules/integrations/dto/provider-config.dto.ts
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ProviderEntryDto {
  @ApiProperty({ example: "duffel" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "Duffel" })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ example: ["flights", "stays"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedServices?: string[];
}

export class UpdateProviderConfigDto {
  @ApiPropertyOptional({ type: [ProviderEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProviderEntryDto)
  providers?: ProviderEntryDto[];

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercentage?: number;

  @ApiPropertyOptional({ enum: ["percentage", "fixed"] })
  @IsOptional()
  @IsEnum(["percentage", "fixed"])
  commissionType?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedCommissionAmount?: number;

  @ApiPropertyOptional({ example: "USD" })
  @IsOptional()
  @IsString()
  commissionCurrency?: string;
}

export class ToggleProviderDto {
  @ApiProperty({ example: "duffel" })
  @IsString()
  providerName: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;
}
