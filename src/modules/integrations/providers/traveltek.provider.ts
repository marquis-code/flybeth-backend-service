import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";

@Injectable()
export class TraveltekProvider {
  private readonly logger = new Logger(TraveltekProvider.name);
  private readonly authClient: AxiosInstance;
  private readonly apiClient: AxiosInstance;
  
  private readonly username: string;
  private readonly password: string;
  
  private authorizationToken: string | null = null;
  private idToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private readonly configService: ConfigService) {
    const authUrl = this.configService.get<string>("TRAVELTEK_AUTH_URL") || "auth.cruiseconnect.traveltek.net";
    const apiUrl = this.configService.get<string>("TRAVELTEK_API_URL") || "jarvis.cruiseconnect.traveltek.net";
    
    this.username = this.configService.get<string>("TRAVELTEK_USERNAME") || "";
    this.password = this.configService.get<string>("TRAVELTEK_PASSWORD") || "";

    this.authClient = axios.create({
      baseURL: `https://${authUrl}`,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.apiClient = axios.create({
      baseURL: `https://${apiUrl}`,
      headers: {
        "Content-Type": "application/json",
        "Accept-Encoding": "application/gzip",
      },
    });
  }

  private async authenticate(): Promise<{ authorizationToken: string; idToken: string }> {
    if (this.authorizationToken && this.idToken && Date.now() < this.tokenExpiresAt) {
      return {
        authorizationToken: this.authorizationToken,
        idToken: this.idToken,
      };
    }

    if (!this.username || !this.password) {
      this.logger.warn("Traveltek credentials missing, using mock tokens for development");
      // Fallback for development if keys aren't set yet.
      return { authorizationToken: "mock_auth", idToken: "mock_id" };
    }

    try {
      const response = await this.authClient.post("/tokens", {
        username: this.username,
        password: this.password,
      });

      this.authorizationToken = response.data.authorization_token;
      this.idToken = response.data.id_token;
      
      // Tokens are valid for 1 hour. We cache for 55 minutes (3300 seconds).
      this.tokenExpiresAt = Date.now() + 3300 * 1000;
      
      return {
        authorizationToken: this.authorizationToken as string,
        idToken: this.idToken as string,
      };
    } catch (error: any) {
      this.logger.error(`Traveltek Authentication Failed: ${error.message}`, error.response?.data);
      throw new HttpException("Failed to authenticate with Traveltek", HttpStatus.UNAUTHORIZED);
    }
  }

  public async searchCruises(params: any): Promise<any> {
    const tokens = await this.authenticate();
    
    let queryArgs: string[] = [];
    if (params.destination && params.destination !== "Any") {
      queryArgs.push(`destination: "${params.destination}"`);
    }
    if (params.embarkPort) {
      queryArgs.push(`embarkPort: "${params.embarkPort}"`);
    }
    if (params.cruiseLine && params.cruiseLine !== "Any") {
      queryArgs.push(`supplierCode: "${params.cruiseLine}"`); // Mapping the generic name to supplier code might be needed later, assuming it's a code for now
    }
    if (params.durationMin) {
      queryArgs.push(`durationMin: ${params.durationMin}`);
    }
    if (params.durationMax) {
      queryArgs.push(`durationMax: ${params.durationMax}`);
    }
    if (params.embarkEarliestDate) {
      queryArgs.push(`embarkEarliestDate: "${params.embarkEarliestDate}"`);
    }
    if (params.embarkLatestDate) {
      queryArgs.push(`embarkLatestDate: "${params.embarkLatestDate}"`);
    }

    const argsString = queryArgs.length > 0 ? `(${queryArgs.join("\n    ")})` : "";

    const graphqlQuery = {
      query: `query Cruises {
        cruises${argsString} {
          resultsMetaData {
            numberOfResults
            minPrice
            maxPrice
          }
          searchResults {
            id
            embarkDate
            product {
              description
              id
              name
            }
            ship {
              code
              name
              line {
                code
                description
                name
              }
            }
            disembarkDate
            disembarkPort
            duration
            embarkPort
            leadInPrices {
              fare
              rateCode
              taxesFeesAndPortExpenses
              available
              cabinDescription
              cabinGrade
              cabinType
              currency
            }
            itineraryItems {
              portName
              portCode
              itineraryItemType
              departureTime
              arrivalTime
              dayNumber
              itemDate
            }
          }
        }
      }`
    };

    try {
      const response = await this.apiClient.post("/graphql", graphqlQuery, {
        headers: {
          tokens: JSON.stringify({
            authorization_token: tokens.authorizationToken,
            id_token: tokens.idToken,
          }),
        },
      });

      return response.data;
    } catch (error: any) {
      this.logger.error(`Traveltek Search Failed: ${error.message}`, error.response?.data);
      // Return empty array instead of failing completely, to degrade gracefully
      return { data: { cruises: { searchResults: [] } } };
    }
  }
}
