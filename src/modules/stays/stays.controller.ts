// src/modules/stays/stays.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { StaysService } from "./stays.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/constants/roles.constant";
import { Public } from "../../common/decorators/public.decorator";
import { StaySearchDto } from "./dto/stays.dto";
import { StaysIntegrationService } from "../integrations/stays-integration.service";
import {
  LiveStaysSearchDto,
  FetchRatesDto,
  CreateQuoteDto,
} from "./dto/live-stays-search.dto";
import { BookStayDto, CancelStayBookingDto } from "./dto/book-stay.dto";

@ApiTags("Stays")
@Controller("stays")
export class StaysController {
  constructor(
    private readonly staysService: StaysService,
    private readonly staysIntegrationService: StaysIntegrationService,
  ) {}

  // ─── Live Provider Search ─────────────────────────────────────

  @Public()
  @Post("search/live")
  @ApiOperation({
    summary: "Search stays from live providers (Duffel)",
    description:
      "Searches all active stays providers and returns aggregated results sorted by lowest price including commission.",
  })
  searchLive(@Body() searchDto: LiveStaysSearchDto) {
    return this.staysIntegrationService.search({
      location: searchDto.location,
      accommodationId: searchDto.accommodationId,
      checkInDate: searchDto.checkInDate,
      checkOutDate: searchDto.checkOutDate,
      guests: searchDto.guests.map((g) => ({
        type: g.type as "adult" | "child",
        age: g.age,
      })),
      rooms: searchDto.rooms || 1,
      freeCancellationOnly: searchDto.freeCancellationOnly,
    });
  }

  @Public()
  @Post("rates")
  @ApiOperation({
    summary: "Fetch rooms and rates for a search result",
  })
  fetchRates(@Body() dto: FetchRatesDto) {
    // Normalize search queries if provided from search widget
    const query: any = {
      checkInDate: dto.checkInDate || dto.checkIn,
      checkOutDate: dto.checkOutDate || dto.checkOut,
      rooms: dto.rooms,
    };

    if (dto.guests) {
      query.guests = dto.guests;
    } else if (dto.adults !== undefined) {
      query.guests = [
        ...Array(dto.adults)
          .fill(null)
          .map(() => ({ type: "adult" })),
        ...Array(dto.children || 0)
          .fill(null)
          .map(() => ({ type: "child", age: 7 })),
      ];
    }

    return this.staysIntegrationService.fetchRates(
      dto.searchResultId,
      dto.provider,
      query.checkInDate ? query : undefined,
    );
  }

  @Public()
  @Post("quote")
  @ApiOperation({
    summary: "Create a price-confirmed quote for a rate",
  })
  createQuote(@Body() dto: CreateQuoteDto) {
    return this.staysIntegrationService.createQuote(dto.rateId, dto.provider);
  }

  @Public()
  @Post("book")
  @ApiOperation({
    summary: "Create a stays booking through a live provider",
  })
  bookStay(@Body() bookDto: BookStayDto) {
    return this.staysIntegrationService.createBooking(
      bookDto.quoteId,
      bookDto.guestDetails,
      bookDto.provider,
    );
  }

  @Public()
  @Post("cancel")
  @ApiOperation({
    summary: "Cancel a stays booking through a live provider",
  })
  cancelBooking(@Body() cancelDto: CancelStayBookingDto) {
    return this.staysIntegrationService.cancelBooking(
      cancelDto.bookingId,
      cancelDto.provider,
    );
  }

  // ─── Internal DB ──────────────────────────────────────────────

  @Roles(Role.TENANT_ADMIN, Role.SUPER_ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a stay" })
  createStay(@Body() createDto: any) {
    return this.staysService.createStay(createDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: "Search stays from internal database" })
  searchStays(@Query() query: StaySearchDto) {
    return this.staysService.search(query);
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get stay by ID" })
  async getStay(@Param("id") id: string, @Query("provider") provider?: string) {
    if (provider && provider !== "internal") {
      try {
        return await this.staysIntegrationService.getDetails(id, provider);
      } catch (err) {
        // If live fetch fails, try internal DB as fallback
      }
    }
    return this.staysService.getStayById(id);
  }

  @Roles(Role.TENANT_ADMIN, Role.SUPER_ADMIN)
  @Post(":id/rooms")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add a room to a stay" })
  addRoom(@Param("id") id: string, @Body() createRoomDto: any) {
    return this.staysService.addRoom(id, createRoomDto);
  }

  @Public()
  @Get(":id/rooms")
  @ApiOperation({ summary: "Get rooms for a stay" })
  getRooms(@Param("id") id: string) {
    return this.staysService.getRooms(id);
  }
}
