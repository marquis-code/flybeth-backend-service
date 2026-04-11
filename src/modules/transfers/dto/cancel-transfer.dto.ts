// src/modules/transfers/dto/cancel-transfer.dto.ts
import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CancelTransferDto {
  @ApiProperty({
    example: "offer_12345",
    description: "The order ID to cancel",
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: "39485720R", description: "The confirmation number" })
  @IsString()
  @IsNotEmpty()
  confirmNbr: string;

  @ApiProperty({
    example: "amadeus",
    description: "The provider used for the order",
  })
  @IsString()
  @IsNotEmpty()
  provider: string;
}
