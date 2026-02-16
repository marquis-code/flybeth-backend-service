import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmadeusBaseProvider } from './amadeus-base.provider';
export declare class AmadeusInsightsProvider extends AmadeusBaseProvider implements OnModuleInit {
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    mostTraveledDestinations(params: {
        originCityCode: string;
        period: string;
        sort?: string;
        max?: number;
    }): Promise<any>;
    mostBookedDestinations(params: {
        originCityCode: string;
        period: string;
    }): Promise<any>;
    busiestTravelingPeriod(params: {
        cityCode: string;
        period: string;
        direction?: string;
    }): Promise<any>;
}
