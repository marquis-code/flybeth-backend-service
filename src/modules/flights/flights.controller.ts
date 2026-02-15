// src/modules/flights/flights.controller.ts
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FlightsService } from './flights.service';
import { CreateFlightDto, SearchFlightsDto, UpdateFlightDto } from './dto/flight.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/constants/roles.constant';
import { MongoIdValidationPipe } from '../../common/pipes/mongo-id-validation.pipe';

@ApiTags('Flights')
@Controller('flights')
export class FlightsController {
    constructor(private readonly flightsService: FlightsService) { }

    @Public()
    @Post('search')
    @ApiOperation({ summary: 'Search flights with filters' })
    search(@Body() searchDto: SearchFlightsDto) {
        return this.flightsService.search(searchDto);
    }

    @Public()
    @Get('popular')
    @ApiOperation({ summary: 'Get popular/featured flights' })
    getPopular(@Query('limit') limit?: number) {
        return this.flightsService.getPopularFlights(limit);
    }

    @Public()
    @Get('deals')
    @ApiOperation({ summary: 'Get flight deals (cheapest)' })
    getDeals(@Query('limit') limit?: number) {
        return this.flightsService.getDeals(limit);
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get flight by ID' })
    findOne(@Param('id', MongoIdValidationPipe) id: string) {
        return this.flightsService.findById(id);
    }

    @Post()
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.AGENT)
    @ApiOperation({ summary: 'Create a new flight (Admin/Agent)' })
    create(@Body() createFlightDto: CreateFlightDto) {
        return this.flightsService.create(createFlightDto);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.AGENT)
    @ApiOperation({ summary: 'Update flight details' })
    update(
        @Param('id', MongoIdValidationPipe) id: string,
        @Body() updateFlightDto: UpdateFlightDto,
    ) {
        return this.flightsService.update(id, updateFlightDto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
    @ApiOperation({ summary: 'Delete a flight' })
    remove(@Param('id', MongoIdValidationPipe) id: string) {
        return this.flightsService.delete(id);
    }
}
