import { AmadeusInsightsProvider } from '../providers/amadeus-insights.provider';
export declare class AmadeusInsightsController {
    private readonly provider;
    constructor(provider: AmadeusInsightsProvider);
    mostTraveled(originCityCode: string, period: string, sort?: string, max?: number): Promise<any>;
    mostBooked(originCityCode: string, period: string): Promise<any>;
    busiestPeriod(cityCode: string, period: string, direction?: string): Promise<any>;
}
