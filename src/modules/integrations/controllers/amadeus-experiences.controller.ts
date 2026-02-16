// src/modules/integrations/controllers/amadeus-experiences.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { AmadeusExperiencesProvider } from '../providers/amadeus-experiences.provider';

@ApiTags('Amadeus — Destination Experiences')
@Controller('amadeus/experiences')
export class AmadeusExperiencesController {
    constructor(private readonly provider: AmadeusExperiencesProvider) { }

    @Public()
    @Get('activities')
    @ApiOperation({ summary: 'Tours & Activities by location' })
    @ApiQuery({ name: 'latitude', type: Number, example: 41.397158 })
    @ApiQuery({ name: 'longitude', type: Number, example: 2.160873 })
    @ApiQuery({ name: 'radius', type: Number, required: false })
    getActivities(
        @Query('latitude') latitude: number,
        @Query('longitude') longitude: number,
        @Query('radius') radius?: number,
    ) {
        return this.provider.getActivities({ latitude: +latitude, longitude: +longitude, radius: radius ? +radius : undefined });
    }

    @Public()
    @Get('activities/by-square')
    @ApiOperation({ summary: 'Tours & Activities within a geographic square' })
    @ApiQuery({ name: 'north', type: Number, example: 41.397158 })
    @ApiQuery({ name: 'west', type: Number, example: 2.160873 })
    @ApiQuery({ name: 'south', type: Number, example: 41.394582 })
    @ApiQuery({ name: 'east', type: Number, example: 2.177181 })
    getActivitiesBySquare(
        @Query('north') north: number,
        @Query('west') west: number,
        @Query('south') south: number,
        @Query('east') east: number,
    ) {
        return this.provider.getActivitiesBySquare({ north: +north, west: +west, south: +south, east: +east });
    }

    @Public()
    @Get('activities/:activityId')
    @ApiOperation({ summary: 'Get a specific tour or activity by ID' })
    getActivityById(@Param('activityId') activityId: string) {
        return this.provider.getActivityById(activityId);
    }

    @Public()
    @Get('cities')
    @ApiOperation({ summary: 'City search' })
    @ApiQuery({ name: 'countryCode', example: 'FR' })
    @ApiQuery({ name: 'keyword', example: 'PARIS' })
    @ApiQuery({ name: 'max', type: Number, required: false })
    @ApiQuery({ name: 'include', required: false, example: 'AIRPORTS' })
    citySearch(
        @Query('countryCode') countryCode: string,
        @Query('keyword') keyword: string,
        @Query('max') max?: number,
        @Query('include') include?: string,
    ) {
        return this.provider.citySearch({ countryCode, keyword, max: max ? +max : undefined, include });
    }
}
