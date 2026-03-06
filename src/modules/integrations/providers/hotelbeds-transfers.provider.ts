// src/modules/integrations/providers/hotelbeds-transfers.provider.ts
import { Injectable, Logger } from "@nestjs/common";
import {
  TransfersAdapter,
  TransferSearchQuery,
  TransferSearchResult,
  TransferOrderingResult,
} from "../interfaces/transfers-adapter.interface";
import { HotelbedsHelperService } from "./hotelbeds-helper.service";

@Injectable()
export class HotelbedsTransfersProvider implements TransfersAdapter {
  readonly providerName = "hotelbeds-transfers";
  private readonly logger = new Logger(HotelbedsTransfersProvider.name);

  constructor(private helper: HotelbedsHelperService) {}

  /**
   * Search for available transfers using HotelBeds Transfer API
   * Endpoint: GET /transfer-api/1.0/availability/{language}/from/{fromType}/{fromCode}/to/{toType}/{toCode}/{outbound}/{inbound}/{adults}/{children}/{infants}
   */
  async searchTransfers(
    query: TransferSearchQuery,
  ): Promise<TransferSearchResult[]> {
    this.logger.log(
      `Searching HotelBeds transfers: ${query.startLocationCode} -> ${query.endCityName || query.endGeoCode}`,
    );

    try {
      // Build availability URL path
      const language = "en";
      const fromType = "IATA";
      const fromCode = query.startLocationCode.toUpperCase();

      // Determine destination type and code
      let toType = "ATLAS";
      let toCode = "0"; // fallback
      if (query.endGeoCode) {
        toType = "GPS";
        toCode = query.endGeoCode; // "lat,long"
      } else if (query.endAddressLine) {
        toType = "GPS";
        toCode = query.endGeoCode || "0";
      }

      // Format datetime
      const outbound = query.startDateTime; // ISO format: 2026-05-08T10:00:00
      const adults = query.passengers || 1;
      const children = 0;
      const infants = 0;

      const url = `${this.helper.baseUrl}/transfer-api/1.0/availability/${language}/from/${fromType}/${fromCode}/to/${toType}/${toCode}/${outbound}/${adults}/${children}/${infants}`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.helper.getHeadersFor("transfers"),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(
          `HotelBeds transfer search failed: ${response.status} ${errText}`,
        );
        return [];
      }

      const data = await response.json();
      return this.mapSearchResults(data);
    } catch (error) {
      this.logger.error(`HotelBeds transfer search error: ${error.message}`);
      return [];
    }
  }

  /**
   * Confirm a transfer booking using the rateKey
   * Endpoint: POST /transfer-api/1.0/booking
   */
  async createTransferOrder(
    rateKey: string,
    passengerDetails: any,
  ): Promise<TransferOrderingResult> {
    this.logger.log(`Creating HotelBeds transfer booking`);

    try {
      const body = {
        language: "en",
        holder: {
          name: passengerDetails.firstName,
          surname: passengerDetails.lastName,
          email: passengerDetails.email,
          phone: passengerDetails.phone || "",
        },
        transfers: [
          {
            rateKey: rateKey,
            transferRemarks: passengerDetails.remarks || "",
          },
        ],
        clientReference: `FLYBETH-${Date.now()}`,
        welcomeMessage: passengerDetails.welcomeMessage || "",
      };

      const response = await fetch(
        `${this.helper.baseUrl}/transfer-api/1.0/booking`,
        {
          method: "POST",
          headers: this.helper.getHeadersFor("transfers"),
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          `HotelBeds transfer booking failed: ${response.status} ${errText}`,
        );
      }

      const data = await response.json();
      const booking = data.bookings?.[0] || data;

      return {
        orderId: booking.reference || String(booking.id),
        status: booking.status || "CONFIRMED",
        confirmationNumber: booking.reference,
      };
    } catch (error) {
      this.logger.error(`HotelBeds transfer booking error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel a transfer booking
   * Endpoint: DELETE /transfer-api/1.0/booking/{language}/{reference}
   */
  async cancelTransferOrder(reference: string): Promise<any> {
    this.logger.log(`Cancelling HotelBeds transfer booking: ${reference}`);

    try {
      const response = await fetch(
        `${this.helper.baseUrl}/transfer-api/1.0/booking/en/${reference}`,
        {
          method: "DELETE",
          headers: this.helper.getHeadersFor("transfers"),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(
          `HotelBeds transfer cancellation failed: ${response.status} ${errText}`,
        );
        return { status: "FAILED", message: errText };
      }

      const data = await response.json();
      return {
        status: "CANCELLED",
        reference: data.booking?.reference || reference,
        cancellationReference: data.booking?.cancellationReference,
      };
    } catch (error) {
      this.logger.error(
        `HotelBeds transfer cancellation error: ${error.message}`,
      );
      return { status: "ERROR", message: error.message };
    }
  }

  /**
   * Get booking details
   * Endpoint: GET /transfer-api/1.0/booking/{language}/{reference}
   */
  async getBookingDetails(reference: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.helper.baseUrl}/transfer-api/1.0/booking/en/${reference}`,
        {
          method: "GET",
          headers: this.helper.getHeadersFor("transfers"),
        },
      );

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger.error(
        `HotelBeds transfer booking details error: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Map HotelBeds Transfer API response to internal TransferSearchResult[]
   */
  private mapSearchResults(data: any): TransferSearchResult[] {
    if (!data?.services || !Array.isArray(data.services)) return [];

    return data.services.map((service: any) => {
      // Extract transfer time from transferDetailInfo
      const transferTimeInfo = service.content?.transferDetailInfo?.find(
        (info: any) => info.id === "TRFTIME",
      );
      const luggageInfo = service.content?.transferDetailInfo?.find(
        (info: any) => info.id === "LUGGAGE",
      );

      return {
        provider: this.providerName,
        offerId: service.rateKey,
        transferType: service.transferType, // SHARED | PRIVATE
        vehicleCode: service.vehicle?.code,
        vehicleDescription: `${service.vehicle?.name || ""} (${service.category?.name || ""})`,
        price: service.price?.totalAmount || 0,
        currency: service.price?.currencyId || "EUR",
        duration: transferTimeInfo
          ? `${transferTimeInfo.value} min`
          : undefined,
        cancellationPolicy: service.cancellationPolicies?.[0]
          ? `Free cancellation until ${service.cancellationPolicies[0].from}`
          : undefined,
        // Extended HotelBeds-specific data
        _hotelbeds: {
          serviceId: service.serviceId,
          direction: service.direction,
          pickupInfo: service.pickupInformation?.pickup?.description,
          minPax: service.minPaxCapacity,
          maxPax: service.maxPaxCapacity,
          luggage: luggageInfo?.value,
          images: service.content?.images?.map((img: any) => img.url) || [],
          extras: service.extras || [],
          operationTimes: service.operationTimes || [],
          factsheetId: service.factsheetId,
          providerName: service.provider?.name,
        },
      };
    });
  }
}
