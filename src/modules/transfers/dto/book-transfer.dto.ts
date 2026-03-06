// src/modules/transfers/dto/book-transfer.dto.ts
import { IsString, IsEmail, IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TransferPassengerDetailsDto {
  @ApiProperty({ example: "John" })
  @IsString()
  firstName: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  lastName: string;

  @ApiProperty({ example: "john.doe@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "+1234567890" })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: "Flight AF123 arrival at 10 AM" })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ example: "Welcome John Doe" })
  @IsOptional()
  @IsString()
  welcomeMessage?: string;
}

export class BookTransferDto {
  @ApiProperty({ example: "offer_12345" })
  @IsString()
  offerId: string;

  @ApiProperty({ example: "hotelbeds-transfers" })
  @IsString()
  provider: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => TransferPassengerDetailsDto)
  passengerDetails: TransferPassengerDetailsDto;
}
