// src/modules/transfers/transfers.controller.ts
import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { TransfersIntegrationService } from "../integrations/transfers-integration.service";
import { Public } from "../../common/decorators/public.decorator";
import { SearchTransfersDto } from "./dto/search-transfers.dto";
import { BookTransferDto } from "./dto/book-transfer.dto";
import { CancelTransferDto } from "./dto/cancel-transfer.dto";

@ApiTags("Transfers")
@Controller("transfers")
export class TransfersController {
  constructor(
    private readonly transfersIntegrationService: TransfersIntegrationService,
  ) {}

  @Public()
  @Post("search/live")
  @ApiOperation({ summary: "Search transfers from live providers" })
  searchLive(@Body() searchDto: SearchTransfersDto) {
    return this.transfersIntegrationService.search(searchDto);
  }

  @Public()
  @Post("book")
  @ApiOperation({ summary: "Book a transfer from a live provider" })
  book(@Body() bookDto: BookTransferDto) {
    return this.transfersIntegrationService.createOrder(
      bookDto.offerId,
      bookDto.provider,
      bookDto.passengerDetails,
    );
  }

  @Public()
  @Post("cancel")
  @ApiOperation({ summary: "Cancel a transfer booking" })
  cancelLive(@Body() cancelDto: CancelTransferDto) {
    return this.transfersIntegrationService.cancelOrder(
      cancelDto.orderId,
      cancelDto.confirmNbr,
      cancelDto.provider,
    );
  }
}
