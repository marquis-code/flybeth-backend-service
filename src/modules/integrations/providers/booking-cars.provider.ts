import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import {
  CarAdapter,
  CarSearchQuery,
  CarSearchResult,
  CarPriceCheckResult,
} from "../interfaces/car-adapter.interface";

@Injectable()
export class BookingCarsProvider implements CarAdapter {
  providerName = "booking-cars";
  private readonly logger = new Logger(BookingCarsProvider.name);
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>("BOOKING_COM_API_URL") || "https://demandapi.booking.com/3.1";
    const bearerToken = this.configService.get<string>("BOOKING_COM_BEARER_TOKEN");
    const affiliateId = this.configService.get<string>("BOOKING_COM_AFFILIATE_ID") || "0";

    if (!bearerToken) {
      this.logger.warn("Booking.com Bearer Token not configured. API calls will fail.");
    }

    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        "X-Affiliate-Id": affiliateId,
        Authorization: `Bearer ${bearerToken || ""}`,
      },
    });
  }

  /**
   * Search cars on Booking.com Demand API
   */
  async searchCars(query: CarSearchQuery): Promise<CarSearchResult[]> {
    try {
      this.logger.debug(`Searching Booking.com cars for location: ${query.pickUpLocation}`);
      
      const payload: any = {
        booker: { country: query.bookerCountry || "us" },
        currency: query.currencyCode || "USD",
        driver: { age: query.driverAge || 30 },
        route: {
          pickup: {
            datetime: `${query.pickUpDate}T${query.pickUpTime}`,
          },
          dropoff: {
            datetime: `${query.returnDate}T${query.returnTime}`,
          },
        },
      };

      // Handle location (Coordinate vs Airport code)
      if (query.coordinates) {
        payload.route.pickup.location = {
          coordinates: {
            latitude: query.coordinates.latitude,
            longitude: query.coordinates.longitude,
          }
        };
        payload.route.dropoff.location = {
          coordinates: {
            latitude: query.coordinates.latitude,
            longitude: query.coordinates.longitude,
          }
        };
      } else {
        // Assume IATA code for airport if coordinates not provided
        payload.route.pickup.location = { airport: query.pickUpLocation };
        payload.route.dropoff.location = { airport: query.returnLocation || query.pickUpLocation };
      }

      const response = await this.client.post("/cars/search", payload);
      
      // Map response to our CarSearchResult format
      return this.mapResponseToCarSearchResults(response.data);
    } catch (error) {
      this.logger.error(
        `Booking.com cars search failed: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`
      );
      // Return empty array or throw based on how the aggregator handles it
      return [];
    }
  }

  /**
   * Price check (Look) using /cars/{car_rental_id}/details
   */
  async priceCheck(rateKey: string, details?: any): Promise<CarPriceCheckResult> {
    try {
      // In Booking.com, rateKey could act as car_rental_id.
      // Usually it's a GET request: /cars/{car_rental_id}/details 
      // But the docs mention POST /cars/details (wait, docs say GET /cars/{car_rental_id}/details but screenshots showed POST /cars/details. We'll use GET /cars/{car_rental_id}/details based on the endpoint list).
      const response = await this.client.get(`/cars/${rateKey}/details`);
      
      const data = response.data?.data?.[0]; // Assuming array response based on metadata
      
      if (!data) {
         throw new Error("Details not found");
      }

      const updatedResult = this.mapSingleCarResult(data);

      return {
        bookingKey: rateKey,
        priceChanged: false, // Calculate if price changed if we had previous price
        priceDifference: 0,
        currency: updatedResult.price.currency,
        updatedResult,
      };
    } catch (error) {
       this.logger.error(`Booking.com price check failed: ${error.message}`);
       throw error;
    }
  }

  private mapResponseToCarSearchResults(responseData: any): CarSearchResult[] {
    const results: CarSearchResult[] = [];
    const items = responseData?.data || [];

    for (const item of items) {
      results.push(this.mapSingleCarResult(item));
    }
    return results;
  }

  private mapSingleCarResult(item: any): CarSearchResult {
     return {
        provider: this.providerName,
        vendor: {
          code: item.supplier?.id || "unknown",
          name: item.supplier?.name || "Unknown Vendor",
          logo: item.supplier?.logo_url,
        },
        vehicle: {
          type: item.vehicle?.category || "Standard",
          name: `${item.vehicle?.make || ""} ${item.vehicle?.model || "Unknown"}`.trim(),
          passengers: item.vehicle?.seats || 4,
          bagsLarge: item.vehicle?.bags_large || 1,
          bagsSmall: item.vehicle?.bags_small || 1,
          doors: item.vehicle?.doors,
          transmission: item.vehicle?.transmission,
          airConditioning: item.vehicle?.air_conditioning,
          fuelType: item.vehicle?.fuel_type,
          images: [item.vehicle?.image_url].filter(Boolean) as string[],
        },
        bookingInfo: {
          rateKey: item.id || item.car_rental_id,
          rateCode: item.pricing?.rate_type || "standard",
          availabilityStatus: "AVAILABLE",
        },
        location: {
          pickUp: {
            locationCode: item.route?.pickup?.location_id || "",
            name: item.route?.pickup?.name,
          },
          return: {
            locationCode: item.route?.dropoff?.location_id || "",
            name: item.route?.dropoff?.name,
          },
        },
        price: {
          amount: item.pricing?.price || 0,
          currency: item.pricing?.currency || "USD",
          totalAmount: item.pricing?.price || 0,
          approximateTotal: item.pricing?.price || 0,
        },
      };
  }
}
