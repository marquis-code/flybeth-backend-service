// src/modules/integrations/providers/amadeus-helper.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AmadeusHelperService {
  private readonly logger = new Logger(AmadeusHelperService.name);
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>("AMADEUS_BASE_URL") ||
      "https://test.api.amadeus.com";
    this.apiKey = this.configService.get<string>("AMADEUS_API_KEY") || "";
    this.apiSecret = this.configService.get<string>("AMADEUS_API_SECRET") || "";
  }

  /**
   * Fetch OAuth2 access token from Amadeus
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }

    this.logger.debug("Fetching new Amadeus access token...");

    try {
      const response = await fetch(`${this.baseUrl}/v1/security/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.apiKey,
          client_secret: this.apiSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Amadeus auth failed: ${response.status} ${errorText}`,
        );
        throw new Error(`Amadeus authentication failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
      this.logger.debug("Amadeus access token obtained");
      return this.accessToken!;
    } catch (error) {
      this.logger.error(`Amadeus auth error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search cities using Amadeus Reference Data Locations Cities API
   * Used primarily for plotting destinations for Activities/Experiences
   */
  async searchCities(keyword: string, max: number = 10, countryCode?: string): Promise<any[]> {
    if (!keyword || keyword.length < 3) return [];

    try {
      const token = await this.getAccessToken();
      const params = new URLSearchParams({
        keyword,
        max: String(max),
      });
      if (countryCode) params.append("countryCode", countryCode);

      const response = await fetch(`${this.baseUrl}/v1/reference-data/locations/cities?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`Amadeus city search failed: ${response.status} ${errText}`);
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      this.logger.error(`Amadeus city search error: ${error.message}`);
      return [];
    }
  }

  /**
   * Predict the trip purpose (Business or Leisure) from a flight
   */
  async predictTripPurpose(origin: string, destination: string, departureDate: string, returnDate: string): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const params = new URLSearchParams({
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate,
        returnDate,
      });

      const response = await fetch(`${this.baseUrl}/v1/travel/predictions/trip-purpose?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`Amadeus trip purpose prediction failed: ${response.status} ${errText}`);
        return null;
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      this.logger.error(`Amadeus trip purpose prediction error: ${error.message}`);
      return null;
    }
  }
  /**
   * Parse ISO 8601 duration (PT2H30M) to minutes
   */
  parseDuration(duration?: string): number {
    if (!duration) return 0;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return 0;
    return parseInt(match[1] || "0") * 60 + parseInt(match[2] || "0");
  }
}
