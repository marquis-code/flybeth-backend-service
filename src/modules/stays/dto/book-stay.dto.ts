// src/modules/stays/dto/book-stay.dto.ts
import {
  IsString,
  IsArray,
  ValidateNested,
  IsEmail,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class GuestDetailDto {
  @ApiProperty({ example: "John" })
  @IsString()
  firstName: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  lastName: string;
}

export class StayBookingGuestDto {
  @ApiProperty({ example: "john@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "+1234567890" })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ type: [GuestDetailDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestDetailDto)
  guests: GuestDetailDto[];

  @ApiPropertyOptional({ example: "Non-smoking room, high floor" })
  @IsOptional()
  @IsString()
  specialRequests?: string;
}

export class BookStayDto {
  @ApiProperty({ example: "quo_12345" })
  @IsString()
  quoteId: string;

  @ApiProperty({ example: "duffel" })
  @IsString()
  provider: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => StayBookingGuestDto)
  guestDetails: StayBookingGuestDto;
}

export class CancelStayBookingDto {
  @ApiProperty({ example: "stb_12345" })
  @IsString()
  bookingId: string;

  @ApiProperty({ example: "duffel" })
  @IsString()
  provider: string;
}
