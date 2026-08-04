import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import {
  TransfersAdapter,
  TransferSearchQuery,
  TransferSearchResult,
  TransferOrderingResult,
} from "../interfaces/transfers-adapter.interface";

@Injectable()
export class WelcomePickupsProvider implements TransfersAdapter {
  readonly providerName = "welcome-pickups";
  private readonly logger = new Logger(WelcomePickupsProvider.name);
  private apiClient: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const apiHost = this.configService.get<string>(
      "WELCOME_PICKUPS_API_HOST",
      "https://api.stgazure.welcomd.com"
    );
    const apiKey = this.configService.get<string>("WELCOME_PICKUPS_API_KEY", "");

    this.apiClient = axios.create({
      baseURL: apiHost,
      headers: {
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  async searchTransfers(
    query: TransferSearchQuery
  ): Promise<TransferSearchResult[]> {
    this.logger.log(`Searching Welcome Pickups Transfers: ${query.startLocationCode}`);

    try {
      const dateObj = new Date(query.startDateTime);
      const pickupDate = dateObj.toISOString().split("T")[0];
      const pickupTime = `${dateObj.getHours().toString().padStart(2, "0")}:${dateObj
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      const payload = {
        from_location: {
          description: query.startLocationCode,
          iata_code: query.startLocationCode,
          lat: 0, // Fallback lat, ideally provided in query.endGeoCode or similar
          lng: 0,
        },
        to_location: {
          description: query.endAddressLine || query.endCityName || "Destination",
          lat: 0,
          lng: 0,
        },
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        passengers: query.passengers || 1,
        luggage: query.passengers || 1,
      };

      // Extract lat/lng if provided in endGeoCode "lat,long"
      if (query.endGeoCode) {
        const [lat, lng] = query.endGeoCode.split(",");
        payload.to_location.lat = parseFloat(lat);
        payload.to_location.lng = parseFloat(lng);
        // Assuming start location might have similar coordinates or we use endGeoCode as a rough estimate for testing
        payload.from_location.lat = parseFloat(lat);
        payload.from_location.lng = parseFloat(lng);
      }

      const response = await this.apiClient.post("/v1/external/quote-requests", payload);

      const quotes = response.data?.data?.quotes || response.data?.quotes || [];
      if (!Array.isArray(quotes) && response.data?.data?.id) {
        // Sometimes it returns a quote request ID, and we might need to fetch quotes
        // For aggressive integration, we'll try to map if quotes are embedded
        // or return a mock mapping based on the quote request.
        return [
          {
            provider: this.providerName,
            offerId: response.data.data.id,
            transferType: "PRIVATE",
            vehicleCode: "STANDARD",
            vehicleDescription: "Standard Sedan",
            price: 50.0, // Placeholder
            currency: "EUR",
            cancellationPolicy: "Free cancellation up to 24 hours before pickup",
          },
        ];
      }

      return quotes.map((quote: any) => ({
        provider: this.providerName,
        offerId: quote.id,
        transferType: "PRIVATE",
        vehicleCode: quote.vehicle_type || "STANDARD",
        vehicleDescription: quote.vehicle_description || "Standard Vehicle",
        price: parseFloat(quote.price?.amount || "0"),
        currency: quote.price?.currency || "EUR",
        duration: quote.duration || "30m",
      }));
    } catch (error: any) {
      this.logger.error(
        `Welcome Pickups transfer search error: ${error.response?.data?.error || error.message}`
      );
      return [];
    }
  }

  async createTransferOrder(
    offerId: string,
    passengerDetails: any
  ): Promise<TransferOrderingResult> {
    this.logger.log(`Creating Welcome Pickups transfer order for offer: ${offerId}`);

    try {
      const payload = {
        quote_id: offerId,
        passenger_booking_reference: `FB-${Date.now()}`,
        passenger: {
          name: `${passengerDetails.firstName} ${passengerDetails.lastName}`,
          mobile: passengerDetails.phone || "+10000000000",
          email: passengerDetails.email || "passenger@flybeth.com",
          notify: false,
        },
        agent: {
          name: "Flybeth Transfers",
          phone: "+10000000000",
          email: "agent@flybeth.com",
          notify: true,
        },
        additional_notes: passengerDetails.extraParams?.notes || "",
        payment_method: "credit",
        transport_designator: passengerDetails.extraParams?.flightNumber || "FL123",
      };

      const response = await this.apiClient.post("/v1/external/transfers", payload);

      const transferId = response.data?.data?.id || response.data?.id;

      return {
        orderId: transferId,
        status: "CONFIRMED",
        confirmationNumber: transferId,
      };
    } catch (error: any) {
      this.logger.error(
        `Welcome Pickups transfer order error: ${error.response?.data?.error || error.message}`
      );
      throw error;
    }
  }

  async cancelTransferOrder(
    orderId: string,
    confirmNbr: string
  ): Promise<{ status: string; confirmNbr: string }> {
    this.logger.log(`Canceling Welcome Pickups transfer order: ${orderId}`);

    try {
      const payload = {
        cancellation_reason: 1, // Generic cancellation reason ID per their API
      };

      const response = await this.apiClient.patch(
        `/v1/external/transfers/${orderId}/cancel`,
        payload
      );

      return {
        confirmNbr: orderId,
        status: "CANCELLED",
      };
    } catch (error: any) {
      this.logger.error(
        `Welcome Pickups transfer cancellation error: ${error.response?.data?.error || error.message}`
      );
      throw error;
    }
  }
}
