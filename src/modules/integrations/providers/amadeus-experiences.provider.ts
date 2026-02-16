// src/modules/integrations/providers/amadeus-experiences.provider.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmadeusBaseProvider } from './amadeus-base.provider';

@Injectable()
export class AmadeusExperiencesProvider extends AmadeusBaseProvider implements OnModuleInit {
    constructor(configService: ConfigService) {
        super(configService, AmadeusExperiencesProvider.name);
    }

    async onModuleInit() { await this.warmUpToken(); }

    /** GET /v1/shopping/activities — Tours & Activities by geo coordinates */
    async getActivities(params: { latitude: number; longitude: number; radius?: number }): Promise<any> {
        return this.amadeusGet('/v1/shopping/activities', params);
    }

    /** GET /v1/shopping/activities/:activityId */
    async getActivityById(activityId: string): Promise<any> {
        return this.amadeusGet(`/v1/shopping/activities/${activityId}`);
    }

    /** GET /v1/shopping/activities/by-square — Tours & Activities within a square */
    async getActivitiesBySquare(params: { north: number; west: number; south: number; east: number }): Promise<any> {
        return this.amadeusGet('/v1/shopping/activities/by-square', params);
    }

    /** GET /v1/reference-data/locations/cities — City search */
    async citySearch(params: { countryCode: string; keyword: string; max?: number; include?: string }): Promise<any> {
        return this.amadeusGet('/v1/reference-data/locations/cities', params);
    }
}
