import { AmadeusHotelsProvider } from '../providers/amadeus-hotels.provider';
export declare class AmadeusHotelsController {
    private readonly provider;
    constructor(provider: AmadeusHotelsProvider);
    hotelsByCity(cityCode: string, radius?: number, radiusUnit?: string, amenities?: string, ratings?: string, hotelSource?: string): Promise<any>;
    hotelsByGeocode(latitude: number, longitude: number, radius?: number, radiusUnit?: string): Promise<any>;
    hotelsByIds(hotelIds: string): Promise<any>;
    searchOffers(hotelIds: string, adults?: number, checkInDate?: string, checkOutDate?: string, roomQuantity?: number, priceRange?: string, currency?: string, bestRateOnly?: boolean): Promise<any>;
    getOffer(offerId: string): Promise<any>;
    bookV1(body: any): Promise<any>;
    bookV2(body: any): Promise<any>;
    ratings(hotelIds: string): Promise<any>;
    autocomplete(keyword: string, subType?: string, countryCode?: string, lang?: string, max?: number): Promise<any>;
}
