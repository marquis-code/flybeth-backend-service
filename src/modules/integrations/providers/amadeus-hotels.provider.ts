// src/modules/integrations/providers/amadeus-hotels.provider.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmadeusBaseProvider } from './amadeus-base.provider';

@Injectable()
export class AmadeusHotelsProvider extends AmadeusBaseProvider implements OnModuleInit {
    constructor(configService: ConfigService) {
        super(configService, AmadeusHotelsProvider.name);
    }

    async onModuleInit() { await this.warmUpToken(); }

    // ─── Hotel List ───

    /** GET /v1/reference-data/locations/hotels/by-city */
    async hotelsByCity(params: { cityCode: string; radius?: number; radiusUnit?: string; amenities?: string; ratings?: string; hotelSource?: string }): Promise<any> {
        return this.amadeusGet('/v1/reference-data/locations/hotels/by-city', params);
    }

    /** GET /v1/reference-data/locations/hotels/by-geocode */
    async hotelsByGeocode(params: { latitude: number; longitude: number; radius?: number; radiusUnit?: string }): Promise<any> {
        return this.amadeusGet('/v1/reference-data/locations/hotels/by-geocode', params);
    }

    /** GET /v1/reference-data/locations/hotels/by-hotels */
    async hotelsByIds(params: { hotelIds: string }): Promise<any> {
        return this.amadeusGet('/v1/reference-data/locations/hotels/by-hotels', params);
    }

    // ─── Hotel Offers ───

    /** GET /v3/shopping/hotel-offers — Search hotel offers */
    async searchHotelOffers(params: { hotelIds: string; adults?: number; checkInDate?: string; checkOutDate?: string; roomQuantity?: number; priceRange?: string; currency?: string; bestRateOnly?: boolean }): Promise<any> {
        return this.amadeusGet('/v3/shopping/hotel-offers', params);
    }

    /** GET /v3/shopping/hotel-offers/:offerId — Get specific offer */
    async getHotelOffer(offerId: string): Promise<any> {
        return this.amadeusGet(`/v3/shopping/hotel-offers/${offerId}`);
    }

    // ─── Booking ───

    /** POST /v1/booking/hotel-bookings — Hotel Booking v1 */
    async createHotelBookingV1(body: any): Promise<any> {
        return this.amadeusPost('/v1/booking/hotel-bookings', body);
    }

    /** POST /v2/booking/hotel-orders — Hotel Booking v2 */
    async createHotelBookingV2(body: any): Promise<any> {
        return this.amadeusPost('/v2/booking/hotel-orders', body);
    }

    // ─── Extras ───

    /** GET /v2/e-reputation/hotel-sentiments — Hotel Ratings */
    async hotelRatings(params: { hotelIds: string }): Promise<any> {
        return this.amadeusGet('/v2/e-reputation/hotel-sentiments', params);
    }

    /** GET /v1/reference-data/locations/hotel — Hotel Name Autocomplete */
    async hotelNameAutocomplete(params: { keyword: string; subType?: string; countryCode?: string; lang?: string; max?: number }): Promise<any> {
        return this.amadeusGet('/v1/reference-data/locations/hotel', params);
    }
}
