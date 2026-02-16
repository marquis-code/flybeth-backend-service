// src/modules/integrations/providers/amadeus-itinerary.provider.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmadeusBaseProvider } from './amadeus-base.provider';

@Injectable()
export class AmadeusItineraryProvider extends AmadeusBaseProvider implements OnModuleInit {
    constructor(configService: ConfigService) {
        super(configService, AmadeusItineraryProvider.name);
    }

    async onModuleInit() { await this.warmUpToken(); }

    /** GET /v1/travel/predictions/trip-purpose — Trip Purpose Prediction */
    async tripPurposePrediction(params: {
        originLocationCode: string;
        destinationLocationCode: string;
        departureDate: string;
        returnDate: string;
    }): Promise<any> {
        return this.amadeusGet('/v1/travel/predictions/trip-purpose', params);
    }
}
