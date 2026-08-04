import { Injectable, Logger } from "@nestjs/common";
import { AiraloProvider } from "../integrations/providers/airalo.provider";

@Injectable()
export class EsimsService {
  private readonly logger = new Logger(EsimsService.name);

  constructor(private readonly airaloProvider: AiraloProvider) {}

  async getPackages(query: any) {
    return this.airaloProvider.getPackages({
      limit: query.limit ? parseInt(query.limit) : 100,
      page: query.page ? parseInt(query.page) : 1,
      filterType: query.type,
      filterCountry: query.country,
      include: query.include,
    });
  }

  async submitOrder(packageId: string, quantity: number, description?: string) {
    return this.airaloProvider.submitOrder(packageId, quantity, description);
  }

  async getInstructions(simIccid: string) {
    return this.airaloProvider.getInstructions(simIccid);
  }
}
