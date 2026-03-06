// src/modules/experiences/experiences.controller.ts
import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ExperiencesIntegrationService } from "../integrations/experiences-integration.service";
import { Public } from "../../common/decorators/public.decorator";
import { SearchExperiencesDto } from "./dto/search-experiences.dto";
import { BookExperienceDto } from "./dto/book-experience.dto";

@ApiTags("Experiences")
@Controller("experiences")
export class ExperiencesController {
  constructor(
    private readonly experiencesIntegrationService: ExperiencesIntegrationService,
  ) {}

  @Public()
  @Post("search/live")
  @ApiOperation({
    summary: "Search experiences (activities) from live providers",
  })
  searchLive(@Body() searchDto: SearchExperiencesDto) {
    return this.experiencesIntegrationService.search(searchDto);
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get experience details" })
  getDetails(@Param("id") id: string, @Query("provider") provider: string) {
    return this.experiencesIntegrationService.getDetails(id, provider);
  }

  @Public()
  @Post("book")
  @ApiOperation({ summary: "Book an experience from a live provider" })
  book(@Body() bookDto: BookExperienceDto) {
    return this.experiencesIntegrationService.createBooking(
      bookDto,
      bookDto.provider,
    );
  }
}
