// src/modules/integrations/providers/amadeus-insights.provider.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmadeusBaseProvider } from './amadeus-base.provider';

@Injectable()
export class AmadeusInsightsProvider extends AmadeusBaseProvider implements OnModuleInit {
    constructor(configService: ConfigService) {
        super(configService, AmadeusInsightsProvider.name);
    }

    async onModuleInit() { await this.warmUpToken(); }

    /** GET /v1/travel/analytics/air-traffic/traveled — Most traveled destinations */
    async mostTraveledDestinations(params: { originCityCode: string; period: string; sort?: string; max?: number }): Promise<any> {
        return this.amadeusGet('/v1/travel/analytics/air-traffic/traveled', params);
    }

    /** GET /v1/travel/analytics/air-traffic/booked — Most booked destinations */
    async mostBookedDestinations(params: { originCityCode: string; period: string }): Promise<any> {
        return this.amadeusGet('/v1/travel/analytics/air-traffic/booked', params);
    }

    /** GET /v1/travel/analytics/air-traffic/busiest-period — Busiest traveling period */
    async busiestTravelingPeriod(params: { cityCode: string; period: string; direction?: string }): Promise<any> {
        return this.amadeusGet('/v1/travel/analytics/air-traffic/busiest-period', params);
    }
}
