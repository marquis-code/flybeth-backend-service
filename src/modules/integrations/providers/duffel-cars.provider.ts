import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import {
  CarAdapter,
  CarSearchQuery,
  CarSearchResult,
  CarPriceCheckResult,
} from "../interfaces/car-adapter.interface";
import { AirportsService } from "../../airports/airports.service";

@Injectable()
export class DuffelCarsProvider implements CarAdapter {
  providerName = "duffel-cars";
  private readonly logger = new Logger(DuffelCarsProvider.name);
  private readonly apiUrl = "https://api.duffel.com/cars";
  private readonly headers: any;

  constructor(
    private configService: ConfigService,
    private airportsService: AirportsService,
  ) {
    const token = this.configService.get<string>("DUFFEL_ACCESS_TOKEN");
    this.headers = {
      "Accept-Encoding": "gzip",
      Accept: "application/json",
      "Content-Type": "application/json",
      "Duffel-Version": "v2",
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Search cars on Duffel
   */
  async searchCars(query: CarSearchQuery): Promise<CarSearchResult[]> {
    try {
      // Duffel requires geographic coordinates for pickup and dropoff.
      // We will look up the IATA code using the AirportsService.
      const pickupAirport = await this.airportsService.getAirportByCode(query.pickUpLocation);
      if (!pickupAirport || !pickupAirport.lat || !pickupAirport.lng) {
        throw new Error(`Coordinates not found for pickup location: ${query.pickUpLocation}`);
      }

      let dropoffAirport = pickupAirport;
      if (query.returnLocation && query.returnLocation !== query.pickUpLocation) {
        dropoffAirport = await this.airportsService.getAirportByCode(query.returnLocation);
        if (!dropoffAirport || !dropoffAirport.lat || !dropoffAirport.lng) {
          throw new Error(`Coordinates not found for dropoff location: ${query.returnLocation}`);
        }
      }

      const payload = {
        data: {
          pickup_date: query.pickUpDate,
          pickup_time: query.pickUpTime || "10:00",
          pickup_location: {
            radius: 50, // default search radius
            geographic_coordinates: {
              latitude: pickupAirport.lat,
              longitude: pickupAirport.lng,
            },
          },
          dropoff_date: query.returnDate,
          dropoff_time: query.returnTime || "10:00",
          dropoff_location: {
            radius: 50,
            geographic_coordinates: {
              latitude: dropoffAirport.lat,
              longitude: dropoffAirport.lng,
            },
          },
          driver: {
            // Need defaults if not provided in search query since it's required by Duffel
            age: (query as any).driverAge || 30,
            residence_country_code: (query as any).driverCountryCode || "GB",
          },
        },
      };

      const response = await axios.post(`${this.apiUrl}/search`, payload, {
        headers: this.headers,
      });

      const data = response.data.data;
      if (!data || !data.rates) {
        return [];
      }

      // Map Duffel response to our unified CarSearchResult format
      return data.rates.map((rate: any) => ({
        provider: this.providerName,
        vendor: {
          code: rate.supplier.name.substring(0, 3).toUpperCase(),
          name: rate.supplier.name,
          logo: rate.supplier.logo_url,
        },
        vehicle: {
          type: rate.car.category,
          name: rate.car.name,
          passengers: rate.car.max_passengers || 4,
          bagsLarge: rate.car.baggage?.large || 0,
          bagsSmall: rate.car.baggage?.small || 0,
          transmission: rate.car.transmission,
          airConditioning: rate.car.air_conditioning,
          fuelType: rate.car.fuel,
          images: rate.car.images ? rate.car.images.map((img: any) => img.url) : [],
        },
        bookingInfo: {
          rateKey: rate.id, // This is the ID we use to quote/book
          rateCode: rate.car.code,
          availabilityStatus: "AVAILABLE",
        },
        location: {
          pickUp: {
            locationCode: query.pickUpLocation,
            name: rate.pickup_location.name,
            address: {
              line1: rate.pickup_location.address?.line_one || "",
              city: rate.pickup_location.address?.city_name || "",
              country: rate.pickup_location.address?.country_code || "",
            },
            latitude: rate.pickup_location.geographic_coordinates?.latitude?.toString(),
            longitude: rate.pickup_location.geographic_coordinates?.longitude?.toString(),
          },
          return: {
            locationCode: query.returnLocation || query.pickUpLocation,
            name: rate.dropoff_location.name,
            address: {
              line1: rate.dropoff_location.address?.line_one || "",
              city: rate.dropoff_location.address?.city_name || "",
              country: rate.dropoff_location.address?.country_code || "",
            },
            latitude: rate.dropoff_location.geographic_coordinates?.latitude?.toString(),
            longitude: rate.dropoff_location.geographic_coordinates?.longitude?.toString(),
          },
        },
        price: {
          amount: parseFloat(rate.total_amount),
          currency: rate.total_currency,
          baseAmount: parseFloat(rate.base_amount || rate.total_amount),
          totalAmount: parseFloat(rate.total_amount),
          approximateTotal: parseFloat(rate.total_amount),
        },
        extras: [], // Duffel might include charges, we can map them here if needed
      }));
    } catch (error: any) {
      this.logger.error(
        `Duffel Cars Search Error: ${
          error.response?.data?.errors?.[0]?.message || error.message
        }`,
      );
      return [];
    }
  }

  /**
   * Price check is effectively "Create Quote" in Duffel
   */
  async priceCheck(rateKey: string): Promise<CarPriceCheckResult> {
    try {
      const response = await this.createQuote(rateKey);
      
      // If it succeeds, the price hasn't changed.
      // Duffel Quotes essentially lock the price.
      return {
        bookingKey: response.data.id, // The quote ID
        priceChanged: false,
        priceDifference: 0,
        currency: response.data.total_currency,
        updatedResult: null as any, // Not strictly required if unchanged
      };
    } catch (error: any) {
      this.logger.error(`Duffel Cars Price Check Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Creates a quote from a rate_id
   */
  async createQuote(rateId: string): Promise<any> {
    const payload = {
      data: {
        rate_id: rateId,
      },
    };

    const response = await axios.post(`${this.apiUrl}/quotes`, payload, {
      headers: this.headers,
    });

    return response.data;
  }

  /**
   * Books a car from a quote_id
   */
  async bookCar(quoteId: string, driver: any): Promise<any> {
    const payload = {
      data: {
        quote_id: quoteId,
        driver, // Expecting { given_name, family_name, phone_number, email, date_of_birth, user_id }
      },
    };

    const response = await axios.post(`${this.apiUrl}/bookings`, payload, {
      headers: this.headers,
    });

    return response.data;
  }

  /**
   * Cancels a booking
   */
  async cancelBooking(bookingId: string): Promise<any> {
    const response = await axios.post(
      `${this.apiUrl}/bookings/${bookingId}/actions/cancel`,
      {},
      {
        headers: this.headers,
      },
    );

    return response.data;
  }
}
