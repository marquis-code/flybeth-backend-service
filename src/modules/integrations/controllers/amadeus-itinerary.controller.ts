// src/modules/integrations/controllers/amadeus-itinerary.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { AmadeusItineraryProvider } from '../providers/amadeus-itinerary.provider';

@ApiTags('Amadeus — Itinerary Management')
@Controller('amadeus/itinerary')
export class AmadeusItineraryController {
    constructor(private readonly provider: AmadeusItineraryProvider) { }

    @Public()
    @Get('trip-purpose')
    @ApiOperation({ summary: 'Predict trip purpose (business vs leisure)' })
    @ApiQuery({ name: 'originLocationCode', example: 'LON' })
    @ApiQuery({ name: 'destinationLocationCode', example: 'AMS' })
    @ApiQuery({ name: 'departureDate', example: '2025-08-01' })
    @ApiQuery({ name: 'returnDate', example: '2025-08-05' })
    tripPurpose(
        @Query('originLocationCode') originLocationCode: string,
        @Query('destinationLocationCode') destinationLocationCode: string,
        @Query('departureDate') departureDate: string,
        @Query('returnDate') returnDate: string,
    ) {
        return this.provider.tripPurposePrediction({
            originLocationCode,
            destinationLocationCode,
            departureDate,
            returnDate,
        });
    }
}
