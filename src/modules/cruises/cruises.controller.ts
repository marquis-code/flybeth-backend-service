// src/modules/cruises/cruises.controller.ts
import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CruisesService } from './cruises.service';
import { SearchCruisesDto, CreateCruiseDto } from './dto/cruise.dto';

@ApiTags('Cruises')
@Controller('cruises')
export class CruisesController {
    constructor(private readonly cruisesService: CruisesService) { }

    @Get('search')
    @ApiOperation({ summary: 'Search for cruises' })
    async search(@Query() searchDto: SearchCruisesDto) {
        return this.cruisesService.search(searchDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get cruise details by ID' })
    async findById(@Param('id') id: string) {
        return this.cruisesService.findById(id);
    }

    @Post()
    @ApiOperation({ summary: 'Add a new cruise to inventory' })
    async create(@Body() createCruiseDto: CreateCruiseDto) {
        return this.cruisesService.create(createCruiseDto);
    }
}
