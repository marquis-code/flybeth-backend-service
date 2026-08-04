import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import * as qs from "qs";

@Injectable()
export class AiraloProvider {
  private readonly logger = new Logger(AiraloProvider.name);
  private readonly client: AxiosInstance;
  private readonly clientId: string;
  private readonly clientSecret: string;
  
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>("AIRALO_API_URL") || "https://sandbox-partners-api.airalo.com";
    this.clientId = this.configService.get<string>("AIRALO_CLIENT_ID") || "";
    this.clientSecret = this.configService.get<string>("AIRALO_CLIENT_SECRET") || "";

    this.client = axios.create({
      baseURL,
      headers: {
        Accept: "application/json",
      },
    });
  }

  private async authenticate(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new HttpException("Airalo credentials missing", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const data = qs.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "client_credentials",
      });

      const response = await this.client.post("/v2/token", data, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      this.accessToken = response.data.data.access_token;
      // Expires_in is in seconds. Subtract 60 seconds as a safety buffer.
      this.tokenExpiresAt = Date.now() + (response.data.data.expires_in - 60) * 1000;
      return this.accessToken as string;
    } catch (error: any) {
      this.logger.error(`Airalo Authentication Failed: ${error.message}`, error.response?.data);
      throw new HttpException("Failed to authenticate with Airalo", HttpStatus.UNAUTHORIZED);
    }
  }

  async getPackages(params?: { limit?: number; page?: number; filterType?: string; filterCountry?: string; include?: string }) {
    const token = await this.authenticate();
    
    try {
      const queryParams: any = {};
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.page) queryParams.page = params.page;
      if (params?.filterType) queryParams["filter[type]"] = params.filterType;
      if (params?.filterCountry) queryParams["filter[country]"] = params.filterCountry;
      if (params?.include) queryParams.include = params.include;

      const response = await this.client.get("/v2/packages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: queryParams,
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(`Airalo getPackages failed: ${error.message}`, error.response?.data);
      throw new HttpException("Failed to fetch eSIM packages", HttpStatus.BAD_GATEWAY);
    }
  }

  async submitOrder(packageId: string, quantity: number = 1, description?: string) {
    const token = await this.authenticate();

    try {
      const data = qs.stringify({
        quantity,
        package_id: packageId,
        type: "sim",
        description: description || `Flybeth order for ${packageId}`,
      });

      const response = await this.client.post("/v2/orders", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(`Airalo submitOrder failed: ${error.message}`, error.response?.data);
      throw new HttpException(error.response?.data?.meta?.message || "Failed to submit eSIM order", HttpStatus.BAD_REQUEST);
    }
  }

  async getInstructions(simIccid: string) {
    const token = await this.authenticate();

    try {
      const response = await this.client.get(`/v2/sims/${simIccid}/instructions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(`Airalo getInstructions failed: ${error.message}`, error.response?.data);
      throw new HttpException("Failed to fetch eSIM instructions", HttpStatus.BAD_GATEWAY);
    }
  }
}
