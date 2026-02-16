import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmadeusBaseProvider } from './amadeus-base.provider';
export declare class AmadeusItineraryProvider extends AmadeusBaseProvider implements OnModuleInit {
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    tripPurposePrediction(params: {
        originLocationCode: string;
        destinationLocationCode: string;
        departureDate: string;
        returnDate: string;
    }): Promise<any>;
}
