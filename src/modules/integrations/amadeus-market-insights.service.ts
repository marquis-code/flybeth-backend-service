// src/modules/integrations/amadeus-market-insights.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { AmadeusHelperService } from "./providers/amadeus-helper.service";

@Injectable()
export class AmadeusMarketInsightsService {
  private readonly logger = new Logger(AmadeusMarketInsightsService.name);

  constructor(private amadeusHelper: AmadeusHelperService) {}

  /**
   * Get busiest periods for a city
   */
  async getBusiestPeriods(
    cityCode: string,
    period: string,
    direction: "ARRIVING" | "DEPARTING" = "ARRIVING",
  ) {
    this.logger.log(`Fetching busiest periods for ${cityCode}`);
    try {
      const result = await this.executeBusiestPeriods(
        cityCode,
        period,
        direction,
      );

      // Fallback for Test API: If current period is empty, try a known historical period (2017)
      if (result.length === 0 && !period.startsWith("2017")) {
        this.logger.warn(
          `No data for ${period}, falling back to 2017 for ${cityCode}`,
        );
        return this.executeBusiestPeriods(cityCode, "2017", direction);
      }

      return result;
    } catch (error) {
      this.logger.error(`Amadeus busiest-period error: ${error.message}`);
      return [];
    }
  }

  private async executeBusiestPeriods(
    cityCode: string,
    period: string,
    direction: string,
  ) {
    const token = await this.amadeusHelper.getAccessToken();
    const params = new URLSearchParams({
      cityCode: cityCode.toUpperCase(),
      period,
      direction,
    });

    const response = await fetch(
      `${this.amadeusHelper.baseUrl}/v1/travel/analytics/air-traffic/busiest-period?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get most traveled destinations from an origin
   */
  async getMostTraveledDestinations(originCityCode: string, period: string) {
    this.logger.log(
      `Fetching most traveled destinations from ${originCityCode}`,
    );
    try {
      const result = await this.executeMostTraveled(originCityCode, period);

      // Fallback for Test API: Try 2019-11 (Known working period for traveled in Test)
      if (result.length === 0 && period !== "2019-11") {
        this.logger.warn(
          `No traveled data for ${period}, falling back to 2019-11 for ${originCityCode}`,
        );
        return this.executeMostTraveled(originCityCode, "2019-11");
      }

      return result;
    } catch (error) {
      this.logger.error(`Amadeus traveled error: ${error.message}`);
      return [];
    }
  }

  private async executeMostTraveled(originCityCode: string, period: string) {
    const token = await this.amadeusHelper.getAccessToken();
    const params = new URLSearchParams({
      originCityCode: originCityCode.toUpperCase(),
      period,
    });

    const response = await fetch(
      `${this.amadeusHelper.baseUrl}/v1/travel/analytics/air-traffic/traveled?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get most booked destinations from an origin
   */
  async getMostBookedDestinations(originCityCode: string, period: string) {
    this.logger.log(`Fetching most booked destinations from ${originCityCode}`);
    try {
      const result = await this.executeMostBooked(originCityCode, period);

      // Fallback for Test API: Try 2017-11 (Known working period for booked in Test)
      if (result.length === 0 && period !== "2017-11") {
        this.logger.warn(
          `No booked data for ${period}, falling back to 2017-11 for ${originCityCode}`,
        );
        return this.executeMostBooked(originCityCode, "2017-11");
      }

      return result;
    } catch (error) {
      this.logger.error(`Amadeus booked error: ${error.message}`);
      return [];
    }
  }

  private async executeMostBooked(originCityCode: string, period: string) {
    const token = await this.amadeusHelper.getAccessToken();
    const params = new URLSearchParams({
      originCityCode: originCityCode.toUpperCase(),
      period,
    });

    const response = await fetch(
      `${this.amadeusHelper.baseUrl}/v1/travel/analytics/air-traffic/booked?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Predict trip purpose (Business vs Leisure)
   */
  async getTripPurposePrediction(
    origin: string,
    destination: string,
    departureDate: string,
    returnDate: string,
  ) {
    this.logger.log(
      `Predicting trip purpose: ${origin} -> ${destination} (${departureDate} - ${returnDate})`,
    );
    try {
      const token = await this.amadeusHelper.getAccessToken();
      const params = new URLSearchParams({
        originLocationCode: origin.toUpperCase(),
        destinationLocationCode: destination.toUpperCase(),
        departureDate,
        returnDate,
      });

      const response = await fetch(
        `${this.amadeusHelper.baseUrl}/v1/travel/predictions/trip-purpose?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) return null;
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      this.logger.error(`Amadeus trip-purpose error: ${error.message}`);
      return null;
    }
  }

  /**
   * Get location score (Sightseeing, Shopping, Nightlife, Restaurant)
   */
  async getLocationScore(latitude: number, longitude: number) {
    this.logger.log(`Fetching location score for ${latitude}, ${longitude}`);
    try {
      const token = await this.amadeusHelper.getAccessToken();
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      });

      const response = await fetch(
        `${this.amadeusHelper.baseUrl}/v1/location/analytics/category-rated-areas?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) return null;
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      this.logger.error(`Amadeus location-score error: ${error.message}`);
      return null;
    }
  }
}
