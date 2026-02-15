// src/modules/cars/cars.controller.ts
import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CarsService } from './cars.service';
import { SearchCarsDto, CreateCarDto } from './dto/car.dto';

@ApiTags('Cars')
@Controller('cars')
export class CarsController {
    constructor(private readonly carsService: CarsService) { }

    @Get('search')
    @ApiOperation({ summary: 'Search for rental cars or rides' })
    async search(@Query() searchDto: SearchCarsDto) {
        return this.carsService.search(searchDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get car details by ID' })
    async findById(@Param('id') id: string) {
        return this.carsService.findById(id);
    }

    @Post()
    @ApiOperation({ summary: 'Add a new car to inventory' })
    async create(@Body() createCarDto: CreateCarDto) {
        return this.carsService.create(createCarDto);
    }

    @Get()
    @ApiOperation({ summary: 'List all cars' })
    async findAll() {
        return this.carsService.findAll();
    }
}
