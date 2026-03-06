// src/modules/integrations/providers/amadeus-transfers.provider.ts
import { Injectable, Logger } from "@nestjs/common";
import {
  TransfersAdapter,
  TransferSearchQuery,
  TransferSearchResult,
  TransferOrderingResult,
} from "../interfaces/transfers-adapter.interface";
import { AmadeusHelperService } from "./amadeus-helper.service";

@Injectable()
export class AmadeusTransfersProvider implements TransfersAdapter {
  readonly providerName = "amadeus";
  private readonly logger = new Logger(AmadeusTransfersProvider.name);

  constructor(private amadeusHelper: AmadeusHelperService) {}

  async searchTransfers(
    query: TransferSearchQuery,
  ): Promise<TransferSearchResult[]> {
    this.logger.log(
      `Searching Amadeus Transfers: ${query.startLocationCode} -> ${query.endCityName}`,
    );

    try {
      const token = await this.amadeusHelper.getAccessToken();

      const body = {
        data: {
          startLocationCode: query.startLocationCode.toUpperCase(),
          endAddressLine: query.endAddressLine,
          endCityName: query.endCityName,
          endZipCode: query.endZipCode,
          endCountryCode: query.endCountryCode?.toUpperCase(),
          endGeoCode: query.endGeoCode,
          transferType: query.transferType || "PRIVATE",
          startDateTime: query.startDateTime,
          passengers: query.passengers || 1,
        },
      };

      const response = await fetch(
        `${this.amadeusHelper.baseUrl}/v1/shopping/transfer-offers`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(
          `Amadeus transfer search failed: ${response.status} ${errText}`,
        );
        return [];
      }

      const data = await response.json();
      return this.mapSearchResults(data);
    } catch (error) {
      this.logger.error(`Amadeus transfer search error: ${error.message}`);
      return [];
    }
  }

  async createTransferOrder(
    offerId: string,
    passengerDetails: any,
  ): Promise<TransferOrderingResult> {
    this.logger.log(`Creating Amadeus transfer order for offer: ${offerId}`);

    try {
      const token = await this.amadeusHelper.getAccessToken();

      const response = await fetch(
        `${this.amadeusHelper.baseUrl}/v1/ordering/transfer-orders?offerId=${offerId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          // Passenger details expected by Amadeus Transfer Ordering
          body: JSON.stringify({
            data: {
              type: "transfer-order",
              passengers: [
                {
                  firstName: passengerDetails.firstName,
                  lastName: passengerDetails.lastName,
                  email: passengerDetails.email,
                  mobile: passengerDetails.phone,
                },
              ],
            },
          }),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          `Amadeus transfer ordering failed: ${response.status} ${errText}`,
        );
      }

      const data = await response.json();
      const order = data.data?.[0] || data.data;

      return {
        orderId: order.id,
        status: order.status || "CONFIRMED",
        confirmationNumber: order.transfers?.[0]?.confirmNbr || order.id,
      };
    } catch (error) {
      this.logger.error(`Amadeus transfer order error: ${error.message}`);
      throw error;
    }
  }

  private mapSearchResults(data: any): TransferSearchResult[] {
    if (!data?.data || !Array.isArray(data.data)) return [];

    return data.data.map((offer: any) => ({
      provider: "amadeus",
      offerId: offer.id,
      transferType: offer.transferType,
      vehicleCode: offer.vehicle?.code,
      vehicleDescription: offer.vehicle?.description,
      price: parseFloat(offer.quotation?.total?.amount || "0"),
      currency: offer.quotation?.total?.currencyCode || "USD",
      distance: offer.distance,
      duration: offer.duration,
      cancellationPolicy: offer.cancellationRules?.[0]?.description,
    }));
  }
}
