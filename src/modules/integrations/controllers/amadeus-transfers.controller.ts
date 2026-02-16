// src/modules/integrations/controllers/amadeus-transfers.controller.ts
import { Controller, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AmadeusTransfersProvider } from '../providers/amadeus-transfers.provider';

@ApiTags('Amadeus — Cars & Transfers')
@Controller('amadeus/transfers')
@ApiBearerAuth()
export class AmadeusTransfersController {
    constructor(private readonly provider: AmadeusTransfersProvider) { }

    @Post('search')
    @ApiOperation({ summary: 'Search transfer offers' })
    search(@Body() body: any) {
        return this.provider.searchTransfers(body);
    }

    @Post('book')
    @ApiOperation({ summary: 'Book a transfer' })
    @ApiQuery({ name: 'offerId', description: 'Transfer offer ID from search' })
    book(@Query('offerId') offerId: string, @Body() body: any) {
        return this.provider.bookTransfer(offerId, body);
    }

    @Post('cancel')
    @ApiOperation({ summary: 'Cancel a transfer booking' })
    @ApiQuery({ name: 'orderId', description: 'Transfer order ID' })
    @ApiQuery({ name: 'confirmNbr', description: 'Transfer confirmation number' })
    cancel(@Query('orderId') orderId: string, @Query('confirmNbr') confirmNbr: string) {
        return this.provider.cancelTransfer(orderId, confirmNbr);
    }
}
