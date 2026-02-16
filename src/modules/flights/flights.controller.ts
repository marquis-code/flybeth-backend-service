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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FlightsService } from './flights.service';
import { CreateFlightDto, SearchFlightsDto, UpdateFlightDto } from './dto/flight.dto';
import { AmadeusSearchDto, AmadeusPriceDto, AmadeusOrderDto } from './dto/amadeus-flight.dto';
import { FlightsIntegrationService } from '../integrations/flights-integration.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/constants/roles.constant';
import { MongoIdValidationPipe } from '../../common/pipes/mongo-id-validation.pipe';

@ApiTags('Flights')
@Controller('flights')
export class FlightsController {
    constructor(
        private readonly flightsService: FlightsService,
        private readonly flightsIntegrationService: FlightsIntegrationService,
    ) { }

    // ═══════════════════════ Amadeus — Flight Booking ═══════════════════════

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Get('amadeus/search')
    @ApiOperation({ summary: 'Search flights via Amadeus (GET)' })
    amadeusSearch(@Query() searchDto: AmadeusSearchDto) {
        return this.flightsIntegrationService.searchAmadeusOffers(searchDto);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Post('amadeus/search')
    @ApiOperation({ summary: 'Search flights via Amadeus (POST — advanced)' })
    amadeusSearchPost(@Body() body: any) {
        return this.flightsIntegrationService.searchAmadeusOffersPost(body);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Post('amadeus/price')
    @ApiOperation({ summary: 'Price a flight offer' })
    amadeusPrice(@Body() priceDto: AmadeusPriceDto) {
        return this.flightsIntegrationService.priceAmadeusOffer(priceDto);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Post('amadeus/order')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a flight order (booking)' })
    amadeusOrder(@Body() orderDto: AmadeusOrderDto) {
        return this.flightsIntegrationService.createAmadeusOrder(orderDto);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Get('amadeus/order/:orderId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get a flight order by ID' })
    amadeusGetOrder(@Param('orderId') orderId: string) {
        return this.flightsIntegrationService.getAmadeusOrder(orderId);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Delete('amadeus/order/:orderId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cancel/delete a flight order' })
    amadeusDeleteOrder(@Param('orderId') orderId: string) {
        return this.flightsIntegrationService.deleteAmadeusOrder(orderId);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Get('amadeus/seatmap')
    @ApiOperation({ summary: 'Get seatmap by flight order ID' })
    @ApiQuery({ name: 'flightOrderId', description: 'Amadeus flight order ID' })
    amadeusSeatmapByOrder(@Query('flightOrderId') flightOrderId: string) {
        return this.flightsIntegrationService.getSeatmapByOrder(flightOrderId);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Post('amadeus/seatmap')
    @ApiOperation({ summary: 'Get seatmap by flight offer (POST)' })
    amadeusSeatmapByOffer(@Body() body: any) {
        return this.flightsIntegrationService.getSeatmapByOffer(body);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Post('amadeus/upsell')
    @ApiOperation({ summary: 'Branded fares upsell' })
    amadeusUpsell(@Body() body: any) {
        return this.flightsIntegrationService.brandedFaresUpsell(body);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Get('amadeus/price-analysis')
    @ApiOperation({ summary: 'Flight price analysis (itinerary price metrics)' })
    @ApiQuery({ name: 'originIataCode', example: 'MAD' })
    @ApiQuery({ name: 'destinationIataCode', example: 'CDG' })
    @ApiQuery({ name: 'departureDate', example: '2025-08-01' })
    @ApiQuery({ name: 'currencyCode', required: false, example: 'EUR' })
    @ApiQuery({ name: 'oneWay', type: Boolean, required: false })
    amadeusPriceAnalysis(
        @Query('originIataCode') originIataCode: string,
        @Query('destinationIataCode') destinationIataCode: string,
        @Query('departureDate') departureDate: string,
        @Query('currencyCode') currencyCode?: string,
        @Query('oneWay') oneWay?: boolean,
    ) {
        return this.flightsIntegrationService.flightPriceAnalysis({
            originIataCode, destinationIataCode, departureDate, currencyCode, oneWay,
        });
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Post('amadeus/prediction')
    @ApiOperation({ summary: 'Flight choice prediction' })
    amadeusPrediction(@Body() body: any) {
        return this.flightsIntegrationService.flightChoicePrediction(body);
    }

    // ═══════════════════════ Amadeus — Flight Inspiration ═══════════════════════

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Get('amadeus/inspiration')
    @ApiOperation({ summary: 'Flight inspiration search — cheapest destinations' })
    @ApiQuery({ name: 'origin', example: 'BOS' })
    @ApiQuery({ name: 'departureDate', required: false })
    @ApiQuery({ name: 'oneWay', type: Boolean, required: false })
    @ApiQuery({ name: 'duration', required: false })
    @ApiQuery({ name: 'maxPrice', type: Number, required: false })
    amadeusInspiration(@Query() params: any) {
        return this.flightsIntegrationService.flightInspirationSearch(params);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Get('amadeus/cheapest-dates')
    @ApiOperation({ summary: 'Flight cheapest date search' })
    @ApiQuery({ name: 'origin', example: 'MAD' })
    @ApiQuery({ name: 'destination', example: 'LON' })
    @ApiQuery({ name: 'departureDate', required: false })
    amadeusCheapestDates(@Query() params: any) {
        return this.flightsIntegrationService.flightCheapestDate(params);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Post('amadeus/availabilities')
    @ApiOperation({ summary: 'Flight availabilities search' })
    amadeusAvailabilities(@Body() body: any) {
        return this.flightsIntegrationService.flightAvailabilities(body);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Get('amadeus/recommendations')
    @ApiOperation({ summary: 'Travel recommendations' })
    @ApiQuery({ name: 'cityCodes', example: 'PAR' })
    @ApiQuery({ name: 'travelerCountryCode', required: false, example: 'FR' })
    amadeusRecommendations(@Query() params: any) {
        return this.flightsIntegrationService.travelRecommendations(params);
    }

    // ═══════════════════════ Amadeus — Flight Schedule ═══════════════════════

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Get('amadeus/status')
    @ApiOperation({ summary: 'On demand flight status' })
    @ApiQuery({ name: 'carrierCode', example: 'BA' })
    @ApiQuery({ name: 'flightNumber', example: '986' })
    @ApiQuery({ name: 'scheduledDepartureDate', example: '2025-08-01' })
    amadeusFlightStatus(@Query() params: any) {
        return this.flightsIntegrationService.onDemandFlightStatus(params);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Get('amadeus/delay-prediction')
    @ApiOperation({ summary: 'Flight delay prediction' })
    amadeusDelayPrediction(@Query() params: any) {
        return this.flightsIntegrationService.flightDelayPrediction(params);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Get('amadeus/airport-ontime')
    @ApiOperation({ summary: 'Airport on-time performance' })
    @ApiQuery({ name: 'airportCode', example: 'JFK' })
    @ApiQuery({ name: 'date', example: '2025-08-01' })
    amadeusAirportOnTime(@Query() params: any) {
        return this.flightsIntegrationService.airportOnTimePerformance(params);
    }

    // ═══════════════════════ Amadeus — Airport / Airlines ═══════════════════════

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Get('amadeus/airports')
    @ApiOperation({ summary: 'Airport & city search by keyword' })
    @ApiQuery({ name: 'subType', example: 'CITY,AIRPORT' })
    @ApiQuery({ name: 'keyword', example: 'MUC' })
    @ApiQuery({ name: 'countryCode', required: false })
    amadeusAirportSearch(@Query() params: any) {
        return this.flightsIntegrationService.airportCitySearch(params);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Get('amadeus/airports/nearest')
    @ApiOperation({ summary: 'Nearest relevant airports' })
    @ApiQuery({ name: 'latitude', type: Number, example: 49 })
    @ApiQuery({ name: 'longitude', type: Number, example: 2.55 })
    amadeusNearestAirports(@Query() params: any) {
        return this.flightsIntegrationService.nearestAirports(params);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Get('amadeus/airports/routes')
    @ApiOperation({ summary: 'Airport direct destinations / routes' })
    @ApiQuery({ name: 'departureAirportCode', example: 'MAD' })
    @ApiQuery({ name: 'max', type: Number, required: false })
    amadeusAirportRoutes(@Query() params: any) {
        return this.flightsIntegrationService.airportRoutes(params);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Get('amadeus/airports/:locationId')
    @ApiOperation({ summary: 'Airport & city search by ID' })
    amadeusAirportById(@Param('locationId') locationId: string) {
        return this.flightsIntegrationService.airportCityById(locationId);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Get('amadeus/airlines/checkin-links')
    @ApiOperation({ summary: 'Flight check-in links' })
    @ApiQuery({ name: 'airlineCode', example: 'IB' })
    amadeusCheckinLinks(@Query() params: any) {
        return this.flightsIntegrationService.flightCheckinLinks(params);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Get('amadeus/airlines/lookup')
    @ApiOperation({ summary: 'Airline code lookup' })
    @ApiQuery({ name: 'airlineCodes', example: 'BA,AIC' })
    amadeusAirlineLookup(@Query() params: any) {
        return this.flightsIntegrationService.airlineCodeLookup(params);
    }

    @ApiTags('Amadeus — Flight Booking')
    @Public()
    @Get('amadeus/airlines/routes')
    @ApiOperation({ summary: 'Airline routes / destinations' })
    @ApiQuery({ name: 'airlineCode', example: 'AF' })
    @ApiQuery({ name: 'max', type: Number, required: false })
    amadeusAirlineRoutes(@Query() params: any) {
        return this.flightsIntegrationService.airlineRoutes(params);
    }

    // ═══════════════════════ Local DB Endpoints ═══════════════════════

    @Public()
    @Post('search')
    @ApiOperation({ summary: 'Search flights from local database' })
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
