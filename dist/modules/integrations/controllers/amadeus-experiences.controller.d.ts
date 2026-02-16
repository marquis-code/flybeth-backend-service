import { AmadeusExperiencesProvider } from '../providers/amadeus-experiences.provider';
export declare class AmadeusExperiencesController {
    private readonly provider;
    constructor(provider: AmadeusExperiencesProvider);
    getActivities(latitude: number, longitude: number, radius?: number): Promise<any>;
    getActivitiesBySquare(north: number, west: number, south: number, east: number): Promise<any>;
    getActivityById(activityId: string): Promise<any>;
    citySearch(countryCode: string, keyword: string, max?: number, include?: string): Promise<any>;
}
