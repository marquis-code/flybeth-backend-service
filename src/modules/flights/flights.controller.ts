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
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { FlightsService } from "./flights.service";
import {
  CreateFlightDto,
  SearchFlightsDto,
  UpdateFlightDto,
} from "./dto/flight.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Public } from "../../common/decorators/public.decorator";
import { Role } from "../../common/constants/roles.constant";
import { MongoIdValidationPipe } from "../../common/pipes/mongo-id-validation.pipe";
import { FlightsIntegrationService } from "../integrations/flights-integration.service";
import { LiveFlightSearchDto } from "./dto/live-flight-search.dto";
import { BookFlightDto, CancelFlightBookingDto } from "./dto/book-flight.dto";

@ApiTags("Flights")
@Controller("flights")
export class FlightsController {
  constructor(
    private readonly flightsService: FlightsService,
    private readonly flightsIntegrationService: FlightsIntegrationService,
  ) {}

  // ─── Live Provider Search ─────────────────────────────────────
  @Public()
  @Post("search/live")
  @ApiOperation({
    summary: "Search flights from live providers (Amadeus + Duffel)",
    description:
      "Searches all active airline providers concurrently and returns aggregated results sorted by lowest price including commission.",
  })
  searchLive(@Body() searchDto: LiveFlightSearchDto) {
    return this.flightsIntegrationService.search({
      origin: searchDto.origin,
      destination: searchDto.destination,
      departureDate: searchDto.departureDate,
      returnDate: searchDto.returnDate,
      adults: searchDto.adults || 1,
      children: searchDto.children || 0,
      infants: searchDto.infants || 0,
      class: searchDto.cabinClass,
      maxConnections: searchDto.maxStops,
    });
  }

  @Public()
  @Post("search/pricing")
  @ApiOperation({
    summary: "Price a flight offer (confirm final fare and taxes)",
  })
  priceOffer(@Body() payload: any) {
    // We expect the frontend to pass { flightOffer, provider }
    const { flightOffer, provider } = payload;
    return this.flightsIntegrationService.priceOffer(flightOffer, provider);
  }

  @Public()
  @Post("seatmaps")
  @ApiOperation({
    summary: "Get seatmap for a flight offer",
  })
  getSeatmap(@Body() payload: any) {
    // We expect the frontend to pass { flightOffer, provider }
    const { flightOffer, provider } = payload;
    return this.flightsIntegrationService.getSeatmap(flightOffer, provider);
  }

  @Public()
  @Get("offers/:id")
  @ApiOperation({
    summary: "Get detailed info for a specific flight offer",
  })
  getOfferDetails(
    @Param("id") id: string,
    @Query("provider") provider: string,
  ) {
    return this.flightsIntegrationService.getOfferDetails(id, provider);
  }

  @Public()
  @Post("book")
  @ApiOperation({
    summary: "Book a flight through a live provider",
  })
  bookFlight(@Body() bookDto: BookFlightDto) {
    return this.flightsIntegrationService.bookFlight(
      bookDto.offerId,
      bookDto.provider,
      bookDto.passengers,
      bookDto.payment,
      bookDto.offer,
    );
  }

  @Public()
  @Post("cancel")
  @ApiOperation({
    summary: "Cancel a flight booking through a live provider",
  })
  cancelBooking(@Body() cancelDto: CancelFlightBookingDto) {
    return this.flightsIntegrationService.cancelBooking(
      cancelDto.orderId,
      cancelDto.provider,
    );
  }

  @Public()
  @Get("locations")
  @ApiOperation({
    summary: "Search for airports and cities by keyword",
  })
  async searchLocations(
    @Query("keyword") keyword: string,
    @Query("countryCode") countryCode?: string,
  ) {
    const data = await this.flightsIntegrationService.searchLocations(
      keyword,
      countryCode,
    );
    return { success: true, data };
  }

  @Public()
  @Get("airports/nearest")
  @ApiOperation({
    summary: "Get nearest airports for a set of coordinates",
  })
  async getNearestAirports(
    @Query("lat") lat: number,
    @Query("lng") lng: number,
  ) {
    const data = await this.flightsIntegrationService.getNearestAirports(
      lat,
      lng,
    );
    return { success: true, data };
  }

  // ─── Internal DB Search ───────────────────────────────────────
  @Public()
  @Post("search")
  @ApiOperation({ summary: "Search flights from internal database" })
  search(@Body() searchDto: SearchFlightsDto) {
    return this.flightsService.search(searchDto);
  }

  @Public()
  @Get("popular")
  @ApiOperation({ summary: "Get popular/featured flights" })
  getPopular(@Query("limit") limit?: number) {
    return this.flightsService.getPopularFlights(limit);
  }

  @Public()
  @Get("deals")
  @ApiOperation({ summary: "Get flight deals (cheapest)" })
  getDeals(@Query("limit") limit?: number) {
    return this.flightsService.getDeals(limit);
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get flight by ID" })
  findOne(@Param("id", MongoIdValidationPipe) id: string) {
    return this.flightsService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.AGENT)
  @ApiOperation({ summary: "Create a new flight (Admin/Agent)" })
  create(@Body() createFlightDto: CreateFlightDto) {
    return this.flightsService.create(createFlightDto);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.AGENT)
  @ApiOperation({ summary: "Update flight details" })
  update(
    @Param("id", MongoIdValidationPipe) id: string,
    @Body() updateFlightDto: UpdateFlightDto,
  ) {
    return this.flightsService.update(id, updateFlightDto);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: "Delete a flight" })
  remove(@Param("id", MongoIdValidationPipe) id: string) {
    return this.flightsService.delete(id);
  }
}
