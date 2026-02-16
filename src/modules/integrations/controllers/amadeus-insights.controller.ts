// src/modules/integrations/controllers/amadeus-insights.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { AmadeusInsightsProvider } from '../providers/amadeus-insights.provider';

@ApiTags('Amadeus — Market Insights')
@Controller('amadeus/insights')
export class AmadeusInsightsController {
    constructor(private readonly provider: AmadeusInsightsProvider) { }

    @Public()
    @Get('most-traveled')
    @ApiOperation({ summary: 'Flight most traveled destinations' })
    @ApiQuery({ name: 'originCityCode', example: 'MAD' })
    @ApiQuery({ name: 'period', example: '2023-11', description: 'YYYY-MM format' })
    @ApiQuery({ name: 'sort', required: false, example: 'analytics.travelers.score' })
    @ApiQuery({ name: 'max', type: Number, required: false })
    mostTraveled(
        @Query('originCityCode') originCityCode: string,
        @Query('period') period: string,
        @Query('sort') sort?: string,
        @Query('max') max?: number,
    ) {
        return this.provider.mostTraveledDestinations({
            originCityCode, period, sort, max: max ? +max : undefined,
        });
    }

    @Public()
    @Get('most-booked')
    @ApiOperation({ summary: 'Flight most booked destinations' })
    @ApiQuery({ name: 'originCityCode', example: 'NCE' })
    @ApiQuery({ name: 'period', example: '2023-11' })
    mostBooked(
        @Query('originCityCode') originCityCode: string,
        @Query('period') period: string,
    ) {
        return this.provider.mostBookedDestinations({ originCityCode, period });
    }

    @Public()
    @Get('busiest-period')
    @ApiOperation({ summary: 'Flight busiest traveling period' })
    @ApiQuery({ name: 'cityCode', example: 'PAR' })
    @ApiQuery({ name: 'period', example: '2023', description: 'YYYY format' })
    @ApiQuery({ name: 'direction', required: false, enum: ['ARRIVING', 'DEPARTING'] })
    busiestPeriod(
        @Query('cityCode') cityCode: string,
        @Query('period') period: string,
        @Query('direction') direction?: string,
    ) {
        return this.provider.busiestTravelingPeriod({ cityCode, period, direction });
    }
}
