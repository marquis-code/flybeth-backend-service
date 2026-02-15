// src/modules/airports/airports.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AirportsService } from './airports.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Airports & Airlines')
@Controller()
export class AirportsController {
    constructor(private readonly airportsService: AirportsService) { }

    @Public()
    @Get('airports/search')
    @ApiOperation({ summary: 'Search airports by name, city, or code' })
    searchAirports(
        @Query('q') query: string,
        @Query('limit') limit?: number,
    ) {
        return this.airportsService.searchAirports(query, limit);
    }

    @Public()
    @Get('airports')
    @ApiOperation({ summary: 'Get all airports' })
    getAllAirports() {
        return this.airportsService.getAllAirports();
    }

    @Public()
    @Get('airports/:code')
    @ApiOperation({ summary: 'Get airport by IATA code' })
    getAirport(@Param('code') code: string) {
        return this.airportsService.getAirportByCode(code);
    }

    @Public()
    @Get('airlines/search')
    @ApiOperation({ summary: 'Search airlines by name or code' })
    searchAirlines(
        @Query('q') query: string,
        @Query('limit') limit?: number,
    ) {
        return this.airportsService.searchAirlines(query, limit);
    }

    @Public()
    @Get('airlines')
    @ApiOperation({ summary: 'Get all airlines' })
    getAllAirlines() {
        return this.airportsService.getAllAirlines();
    }

    @Public()
    @Get('airlines/:code')
    @ApiOperation({ summary: 'Get airline by IATA code' })
    getAirline(@Param('code') code: string) {
        return this.airportsService.getAirlineByCode(code);
    }
}
