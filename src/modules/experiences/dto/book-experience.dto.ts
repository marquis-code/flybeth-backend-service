// src/modules/experiences/dto/book-experience.dto.ts
import {
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

class ExperiencePaxDto {
  @ApiProperty({ example: "John" })
  @IsString()
  name: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  surname: string;

  @ApiProperty({ example: "AD", enum: ["AD", "CH"] })
  @IsString()
  type: string;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @IsOptional()
  age?: number;
}

export class BookExperienceDto {
  @ApiProperty({ example: "rate_12345" })
  @IsString()
  rateKey: string;

  @ApiProperty({ example: "hotelbeds-activities" })
  @IsString()
  provider: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ExperiencePaxDto)
  @IsArray()
  paxes: ExperiencePaxDto[];

  @ApiProperty({ example: "2026-06-15" })
  @IsString()
  dateFrom: string;

  @ApiProperty({ example: "2026-06-15" })
  @IsString()
  dateTo: string;

  @ApiProperty()
  holder: {
    name: string;
    surname: string;
    email?: string;
    phone?: string;
  };
}
