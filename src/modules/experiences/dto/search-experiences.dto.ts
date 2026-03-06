// src/modules/experiences/dto/search-experiences.dto.ts
import { IsNumber, IsOptional } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SearchExperiencesDto {
  @ApiProperty({ example: 48.8566 })
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 2.3522 })
  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 20, description: "Radius in km" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radius?: number;
}
