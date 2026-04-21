// src/modules/flights/dto/book-flight.dto.ts
import {
  IsString,
  IsArray,
  ValidateNested,
  IsEmail,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PassengerDto {
  @ApiProperty({ example: "mr" })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: "John" })
  @IsString()
  firstName: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  lastName: string;

  @ApiProperty({ example: "1990-01-01" })
  @IsString()
  dateOfBirth: string;

  @ApiProperty({ example: "male" })
  @IsString()
  gender: string;

  @ApiProperty({ example: "john@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "+1234567890" })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: "1" })
  @IsOptional()
  @IsString()
  phoneCountryCode?: string;

  @ApiPropertyOptional({ example: "AB123456" })
  @IsOptional()
  @IsString()
  passportNumber?: string;

  @ApiPropertyOptional({ example: "2030-01-01" })
  @IsOptional()
  @IsString()
  passportExpiry?: string;

  @ApiPropertyOptional({ example: "US" })
  @IsOptional()
  @IsString()
  passportCountry?: string;

  @ApiPropertyOptional({ example: "US" })
  @IsOptional()
  @IsString()
  nationality?: string;
}

export class BookFlightDto {
  @ApiProperty({ example: "off_12345" })
  @IsString()
  offerId: string;

  @ApiProperty({ example: "duffel" })
  @IsString()
  provider: string;

  @ApiProperty({ type: [PassengerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers: PassengerDto[];

  @ApiPropertyOptional()
  @IsOptional()
  offer?: any;

  @ApiPropertyOptional()
  @IsOptional()
  payment?: any;

  @ApiPropertyOptional({ type: Array })
  @IsOptional()
  @IsArray()
  services?: { id: string; quantity: number }[];
}

export class CancelFlightBookingDto {
  @ApiProperty({ example: "ord_12345" })
  @IsString()
  orderId: string;

  @ApiProperty({ example: "duffel" })
  @IsString()
  provider: string;
}
