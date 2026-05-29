// src/modules/cars/cars.controller.ts
import { Controller, Get, Post, Body, Query, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { CarsService } from "./cars.service";
import { SearchCarsDto, CreateCarDto, CreateCarQuoteDto, BookCarDto } from "./dto/car.dto";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Cars")
@Controller("cars")
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Public()
  @Get("search")
  @ApiOperation({ summary: "Search for rental cars or rides" })
  async search(@Query() searchDto: SearchCarsDto) {
    return this.carsService.search(searchDto);
  }

  @Post("quotes")
  @ApiOperation({ summary: "Create a car rental quote from a rate ID" })
  async createQuote(@Body() createQuoteDto: CreateCarQuoteDto) {
    return this.carsService.createQuote(createQuoteDto);
  }

  @Post("bookings")
  @ApiOperation({ summary: "Book a car rental from a quote ID" })
  async book(@Body() bookDto: BookCarDto) {
    return this.carsService.book(bookDto);
  }

  @Post("bookings/:id/cancel")
  @ApiOperation({ summary: "Cancel a car booking" })
  async cancelBooking(@Param("id") id: string) {
    return this.carsService.cancelBooking(id);
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get car details by ID" })
  async findById(@Param("id") id: string) {
    return this.carsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: "Add a new car to inventory" })
  async create(@Body() createCarDto: CreateCarDto) {
    return this.carsService.create(createCarDto);
  }

  @Get()
  @ApiOperation({ summary: "List all cars" })
  async findAll() {
    return this.carsService.findAll();
  }
}
