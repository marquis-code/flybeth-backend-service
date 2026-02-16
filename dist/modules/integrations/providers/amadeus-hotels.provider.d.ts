import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmadeusBaseProvider } from './amadeus-base.provider';
export declare class AmadeusHotelsProvider extends AmadeusBaseProvider implements OnModuleInit {
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    hotelsByCity(params: {
        cityCode: string;
        radius?: number;
        radiusUnit?: string;
        amenities?: string;
        ratings?: string;
        hotelSource?: string;
    }): Promise<any>;
    hotelsByGeocode(params: {
        latitude: number;
        longitude: number;
        radius?: number;
        radiusUnit?: string;
    }): Promise<any>;
    hotelsByIds(params: {
        hotelIds: string;
    }): Promise<any>;
    searchHotelOffers(params: {
        hotelIds: string;
        adults?: number;
        checkInDate?: string;
        checkOutDate?: string;
        roomQuantity?: number;
        priceRange?: string;
        currency?: string;
        bestRateOnly?: boolean;
    }): Promise<any>;
    getHotelOffer(offerId: string): Promise<any>;
    createHotelBookingV1(body: any): Promise<any>;
    createHotelBookingV2(body: any): Promise<any>;
    hotelRatings(params: {
        hotelIds: string;
    }): Promise<any>;
    hotelNameAutocomplete(params: {
        keyword: string;
        subType?: string;
        countryCode?: string;
        lang?: string;
        max?: number;
    }): Promise<any>;
}
