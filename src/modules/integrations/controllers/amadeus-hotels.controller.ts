// src/modules/integrations/controllers/amadeus-hotels.controller.ts
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { AmadeusHotelsProvider } from '../providers/amadeus-hotels.provider';

@ApiTags('Amadeus — Hotels')
@Controller('amadeus/hotels')
export class AmadeusHotelsController {
    constructor(private readonly provider: AmadeusHotelsProvider) { }

    // ─── Hotel List ───

    @Public()
    @Get('by-city')
    @ApiOperation({ summary: 'List hotels by city code' })
    @ApiQuery({ name: 'cityCode', example: 'DEL' })
    @ApiQuery({ name: 'radius', type: Number, required: false })
    @ApiQuery({ name: 'radiusUnit', required: false, enum: ['KM', 'MILE'] })
    @ApiQuery({ name: 'amenities', required: false })
    @ApiQuery({ name: 'ratings', required: false })
    @ApiQuery({ name: 'hotelSource', required: false, enum: ['BEDBANK', 'DIRECTCHAIN', 'ALL'] })
    hotelsByCity(
        @Query('cityCode') cityCode: string,
        @Query('radius') radius?: number,
        @Query('radiusUnit') radiusUnit?: string,
        @Query('amenities') amenities?: string,
        @Query('ratings') ratings?: string,
        @Query('hotelSource') hotelSource?: string,
    ) {
        return this.provider.hotelsByCity({
            cityCode,
            radius: radius ? +radius : undefined,
            radiusUnit,
            amenities,
            ratings,
            hotelSource,
        });
    }

    @Public()
    @Get('by-geocode')
    @ApiOperation({ summary: 'List hotels by geographic coordinates' })
    @ApiQuery({ name: 'latitude', type: Number, example: 41.397158 })
    @ApiQuery({ name: 'longitude', type: Number, example: 2.160873 })
    @ApiQuery({ name: 'radius', type: Number, required: false })
    @ApiQuery({ name: 'radiusUnit', required: false, enum: ['KM', 'MILE'] })
    hotelsByGeocode(
        @Query('latitude') latitude: number,
        @Query('longitude') longitude: number,
        @Query('radius') radius?: number,
        @Query('radiusUnit') radiusUnit?: string,
    ) {
        return this.provider.hotelsByGeocode({
            latitude: +latitude,
            longitude: +longitude,
            radius: radius ? +radius : undefined,
            radiusUnit,
        });
    }

    @Public()
    @Get('by-hotels')
    @ApiOperation({ summary: 'List hotels by hotel IDs' })
    @ApiQuery({ name: 'hotelIds', example: 'MCLONGHM' })
    hotelsByIds(@Query('hotelIds') hotelIds: string) {
        return this.provider.hotelsByIds({ hotelIds });
    }

    // ─── Hotel Offers ───

    @Public()
    @Get('offers')
    @ApiOperation({ summary: 'Search hotel offers' })
    @ApiQuery({ name: 'hotelIds', description: 'Comma-separated Amadeus hotel IDs' })
    @ApiQuery({ name: 'adults', type: Number, required: false, example: 1 })
    @ApiQuery({ name: 'checkInDate', required: false })
    @ApiQuery({ name: 'checkOutDate', required: false })
    @ApiQuery({ name: 'roomQuantity', type: Number, required: false })
    @ApiQuery({ name: 'priceRange', required: false })
    @ApiQuery({ name: 'currency', required: false })
    @ApiQuery({ name: 'bestRateOnly', type: Boolean, required: false })
    searchOffers(
        @Query('hotelIds') hotelIds: string,
        @Query('adults') adults?: number,
        @Query('checkInDate') checkInDate?: string,
        @Query('checkOutDate') checkOutDate?: string,
        @Query('roomQuantity') roomQuantity?: number,
        @Query('priceRange') priceRange?: string,
        @Query('currency') currency?: string,
        @Query('bestRateOnly') bestRateOnly?: boolean,
    ) {
        return this.provider.searchHotelOffers({
            hotelIds,
            adults: adults ? +adults : undefined,
            checkInDate,
            checkOutDate,
            roomQuantity: roomQuantity ? +roomQuantity : undefined,
            priceRange,
            currency,
            bestRateOnly,
        });
    }

    @Public()
    @Get('offers/:offerId')
    @ApiOperation({ summary: 'Get specific hotel offer details' })
    getOffer(@Param('offerId') offerId: string) {
        return this.provider.getHotelOffer(offerId);
    }

    // ─── Booking ───

    @Post('booking/v1')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create hotel booking (v1)' })
    bookV1(@Body() body: any) {
        return this.provider.createHotelBookingV1(body);
    }

    @Post('booking/v2')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create hotel booking (v2 — hotel orders)' })
    bookV2(@Body() body: any) {
        return this.provider.createHotelBookingV2(body);
    }

    // ─── Extras ───

    @Public()
    @Get('ratings')
    @ApiOperation({ summary: 'Hotel sentiments / ratings' })
    @ApiQuery({ name: 'hotelIds', example: 'ELONMFS,ADNYCCTB' })
    ratings(@Query('hotelIds') hotelIds: string) {
        return this.provider.hotelRatings({ hotelIds });
    }

    @Public()
    @Get('autocomplete')
    @ApiOperation({ summary: 'Hotel name autocomplete' })
    @ApiQuery({ name: 'keyword', example: 'PARI' })
    @ApiQuery({ name: 'subType', required: false, enum: ['HOTEL_LEISURE', 'HOTEL_GDS'] })
    @ApiQuery({ name: 'countryCode', required: false })
    @ApiQuery({ name: 'lang', required: false })
    @ApiQuery({ name: 'max', type: Number, required: false })
    autocomplete(
        @Query('keyword') keyword: string,
        @Query('subType') subType?: string,
        @Query('countryCode') countryCode?: string,
        @Query('lang') lang?: string,
        @Query('max') max?: number,
    ) {
        return this.provider.hotelNameAutocomplete({
            keyword,
            subType,
            countryCode,
            lang,
            max: max ? +max : undefined,
        });
    }
}
