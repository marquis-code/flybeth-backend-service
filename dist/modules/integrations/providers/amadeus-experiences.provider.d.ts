import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmadeusBaseProvider } from './amadeus-base.provider';
export declare class AmadeusExperiencesProvider extends AmadeusBaseProvider implements OnModuleInit {
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    getActivities(params: {
        latitude: number;
        longitude: number;
        radius?: number;
    }): Promise<any>;
    getActivityById(activityId: string): Promise<any>;
    getActivitiesBySquare(params: {
        north: number;
        west: number;
        south: number;
        east: number;
    }): Promise<any>;
    citySearch(params: {
        countryCode: string;
        keyword: string;
        max?: number;
        include?: string;
    }): Promise<any>;
}
