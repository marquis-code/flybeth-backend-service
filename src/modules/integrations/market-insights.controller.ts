// src/modules/integrations/market-insights.controller.ts
import { Controller, Get, Query, Req } from "@nestjs/common";
import { Request } from "express";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AmadeusMarketInsightsService } from "./amadeus-market-insights.service";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Market Insights")
@Controller("market-insights")
export class MarketInsightsController {
  constructor(private readonly amadeusService: AmadeusMarketInsightsService) {}

  @Public()
  @Get("busiest-period")
  @ApiOperation({ summary: "Get peak and off-peak travel periods for a city" })
  getBusiestPeriods(
    @Query("cityCode") cityCode: string,
    @Query("period") period: string,
    @Query("direction") direction?: "ARRIVING" | "DEPARTING",
  ) {
    return this.amadeusService.getBusiestPeriods(cityCode, period, direction);
  }

  @Public()
  @Get("most-traveled")
  @ApiOperation({ summary: "Get most popular destinations from an origin" })
  getMostTraveled(
    @Query("originCityCode") originCityCode: string,
    @Query("period") period: string,
  ) {
    return this.amadeusService.getMostTraveledDestinations(
      originCityCode,
      period,
    );
  }

  @Public()
  @Get("most-booked")
  @ApiOperation({ summary: "Get most booked destinations from an origin" })
  getMostBooked(
    @Query("originCityCode") originCityCode: string,
    @Query("period") period: string,
  ) {
    return this.amadeusService.getMostBookedDestinations(
      originCityCode,
      period,
    );
  }

  @Public()
  @Get("trip-purpose")
  @ApiOperation({ summary: "Forecast traveler purpose (Business or Leisure)" })
  getTripPurpose(
    @Query("originLocationCode") originLocationCode: string,
    @Query("destinationLocationCode") destinationLocationCode: string,
    @Query("departureDate") departureDate: string,
    @Query("returnDate") returnDate: string,
  ) {
    return this.amadeusService.getTripPurposePrediction(
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
    );
  }

  @Public()
  @Get("detect-location")
  @ApiOperation({ summary: "Detect user location based on IP" })
  async detectLocation(@Req() request: Request) {
    const ip =
      request.headers["x-forwarded-for"] || request.socket.remoteAddress;
    // In local dev, remoteAddress is often ::1 or 127.0.0.1.
    // We will default to Lagos (LOS) for Nigeria-focused app if IP is internal.
    if (!ip || ip === "::1" || ip === "127.0.0.1") {
      return {
        city: "Lagos",
        cityCode: "LOS",
        country: "Nigeria",
        countryCode: "NG",
      };
    }

    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      return {
        city: data.city || "Lagos",
        cityCode:
          data.city === "Lagos"
            ? "LOS"
            : data.city
              ? data.city.substring(0, 3).toUpperCase()
              : "LOS", // Fallback naive code
        country: data.country_name || "Nigeria",
        countryCode: data.country_code || "NG",
      };
    } catch (error) {
      return {
        city: "Lagos",
        cityCode: "LOS",
        country: "Nigeria",
        countryCode: "NG",
      };
    }
  }

  @Public()
  @Get("location-score")
  @ApiOperation({
    summary: "Get category scores (Sightseeing, Shopping, etc) for a location",
  })
  getLocationScore(
    @Query("latitude") latitude: number,
    @Query("longitude") longitude: number,
  ) {
    return this.amadeusService.getLocationScore(latitude, longitude);
  }
}
