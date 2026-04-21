// src/modules/currency/currency.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CurrencyService } from "./currency.service";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/constants/roles.constant";
import { RolesGuard } from "../../common/guards/roles.guard";

@ApiTags("Currency")
@Controller("currency")
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Public()
  @Get("rates")
  @ApiOperation({ summary: "Get internal exchange rates for a base currency" })
  getRates(@Query("base") base?: string) {
    return this.currencyService.getExchangeRates(base || "USD");
  }

  @Public()
  @Get("convert")
  @ApiOperation({ summary: "Convert amount using internal exchange rates" })
  convert(
    @Query("amount") amount: string,
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    return this.currencyService.convert(
      parseFloat(amount),
      from?.toUpperCase() || "USD",
      to?.toUpperCase() || "USD",
    );
  }

  @Public()
  @Get("supported")
  @ApiOperation({ summary: "Get list of supported currencies" })
  getSupportedCurrencies() {
    return this.currencyService.getSupportedCurrencies();
  }

  // Admin Endpoints
  @Get("admin/all")
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: "Admin: Get all currencies including inactive ones" })
  getAllCurrencies() {
    return this.currencyService.getAllCurrencies();
  }

  @Post("admin")
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: "Admin: Create a new currency" })
  createCurrency(@Body() data: any) {
    return this.currencyService.createCurrency(data);
  }

  @Patch("admin/:code")
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  @ApiOperation({ summary: "Admin: Update currency rate or status" })
  updateCurrency(@Param("code") code: string, @Body() update: any) {
    return this.currencyService.updateCurrency(code.toUpperCase(), update);
  }
}
