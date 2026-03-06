// src/modules/integrations/providers/hotelbeds-helper.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

export type HotelbedsApiType = "hotel" | "activities" | "transfers";

interface ApiCredentials {
  apiKey: string;
  apiSecret: string;
}

@Injectable()
export class HotelbedsHelperService {
  private readonly logger = new Logger(HotelbedsHelperService.name);

  readonly baseUrl: string;
  private readonly credentials: Record<HotelbedsApiType, ApiCredentials>;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>("HOTELBEDS_ENDPOINT") ||
      "https://api.test.hotelbeds.com";

    // Legacy fallback keys
    const legacyKey = this.configService.get<string>("HOTELBEDS_API_KEY") || "";
    const legacySecret =
      this.configService.get<string>("HOTELBEDS_SECRET") || "";

    this.credentials = {
      hotel: {
        apiKey:
          this.configService.get<string>("HOTEL_BEDS_HOTEL_API_KEYS") ||
          legacyKey,
        apiSecret:
          this.configService.get<string>("HOTEL_BEDS_HOTEL_SECRET") ||
          legacySecret,
      },
      activities: {
        apiKey:
          this.configService.get<string>("HOTEL_BEDS_ACTIVITIES_API_KEYS") ||
          legacyKey,
        apiSecret:
          this.configService.get<string>("HOTEL_BEDS_ACTIVITIES_SECRET") ||
          legacySecret,
      },
      transfers: {
        apiKey:
          this.configService.get<string>("HOTEL_BEDS_TRANSFER_API_KEYS") ||
          legacyKey,
        apiSecret:
          this.configService.get<string>("HOTEL_BEDS_TRANSFER_SECRET") ||
          legacySecret,
      },
    };

    // Log configured APIs (without exposing secrets)
    for (const [type, creds] of Object.entries(this.credentials)) {
      if (creds.apiKey) {
        this.logger.log(
          `HotelBeds ${type} API configured (key: ${creds.apiKey.substring(0, 8)}...)`,
        );
      } else {
        this.logger.warn(`HotelBeds ${type} API key not configured`);
      }
    }
  }

  /**
   * Generates the X-Signature header required by Hotelbeds
   * Format: SHA256(ApiKey + Secret + TimestampInSeconds)
   */
  generateSignature(apiType: HotelbedsApiType = "hotel"): string {
    const creds = this.credentials[apiType];
    const timestamp = Math.floor(Date.now() / 1000);
    const data = creds.apiKey + creds.apiSecret + timestamp;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Get common headers for a specific HotelBeds API suite
   */
  getHeadersFor(apiType: HotelbedsApiType): Record<string, string> {
    const creds = this.credentials[apiType];
    return {
      "Api-key": creds.apiKey,
      "X-Signature": this.generateSignature(apiType),
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "Content-Type": "application/json",
    };
  }

  /**
   * Legacy method — uses hotel API credentials
   * @deprecated Use getHeadersFor(apiType) instead
   */
  getHeaders(): Record<string, string> {
    return this.getHeadersFor("hotel");
  }
}
