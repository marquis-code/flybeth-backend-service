// src/modules/flights/dto/amadeus-flight.dto.ts
import {
    IsString,
    IsNumber,
    IsOptional,
    IsBoolean,
    IsArray,
    ValidateNested,
    Min,
    Max,
    IsDateString,
    IsEnum,
    IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Amadeus Flight Offers Search (GET) ───

export class AmadeusSearchDto {
    @ApiProperty({ example: 'SYD', description: 'Origin IATA airport/city code' })
    @IsString()
    originLocationCode: string;

    @ApiProperty({ example: 'BKK', description: 'Destination IATA airport/city code' })
    @IsString()
    destinationLocationCode: string;

    @ApiProperty({ example: '2025-08-01', description: 'Departure date (YYYY-MM-DD)' })
    @IsDateString()
    departureDate: string;

    @ApiPropertyOptional({ example: '2025-08-15', description: 'Return date for round-trip (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    returnDate?: string;

    @ApiProperty({ example: 1, description: 'Number of adult travelers', minimum: 1 })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(9)
    adults: number;

    @ApiPropertyOptional({ example: 0, description: 'Number of child travelers' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    children?: number;

    @ApiPropertyOptional({ example: 0, description: 'Number of infant travelers' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    infants?: number;

    @ApiPropertyOptional({ enum: ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'], description: 'Travel class' })
    @IsOptional()
    @IsString()
    travelClass?: string;

    @ApiPropertyOptional({ example: 'TG', description: 'Comma-separated airline IATA codes to include' })
    @IsOptional()
    @IsString()
    includedAirlineCodes?: string;

    @ApiPropertyOptional({ example: 'AA,TP', description: 'Comma-separated airline IATA codes to exclude' })
    @IsOptional()
    @IsString()
    excludedAirlineCodes?: string;

    @ApiPropertyOptional({ example: false, description: 'Only non-stop flights' })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    nonStop?: boolean;

    @ApiPropertyOptional({ example: 'USD', description: 'Currency code for pricing' })
    @IsOptional()
    @IsString()
    currencyCode?: string;

    @ApiPropertyOptional({ example: 1500, description: 'Maximum price filter' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxPrice?: number;

    @ApiPropertyOptional({ example: 5, description: 'Max number of offers to return', default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(250)
    max?: number;
}

// ─── Amadeus Flight Offers Price (POST) ───

export class AmadeusPriceDto {
    @ApiProperty({
        description: 'Wrapper containing the flight offer(s) to price',
        example: {
            type: 'flight-offers-pricing',
            flightOffers: [{ /* a flight offer object from search */ }],
        },
    })
    @IsObject()
    data: {
        type: 'flight-offers-pricing';
        flightOffers: any[];
    };
}

// ─── Amadeus Flight Create Order (POST) ───

class AmadeusTravelerNameDto {
    @ApiProperty({ example: 'JORGE' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'GONZALES' })
    @IsString()
    lastName: string;
}

class AmadeusTravelerPhoneDto {
    @ApiProperty({ example: 'MOBILE' })
    @IsString()
    deviceType: string;

    @ApiProperty({ example: '34' })
    @IsString()
    countryCallingCode: string;

    @ApiProperty({ example: '480080076' })
    @IsString()
    number: string;
}

class AmadeusTravelerContactDto {
    @ApiProperty({ example: 'jorge@email.com' })
    @IsString()
    emailAddress: string;

    @ApiPropertyOptional({ type: [AmadeusTravelerPhoneDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AmadeusTravelerPhoneDto)
    phones?: AmadeusTravelerPhoneDto[];
}

class AmadeusTravelerDocumentDto {
    @ApiProperty({ example: 'PASSPORT' })
    @IsString()
    documentType: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    birthPlace?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    issuanceLocation?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    issuanceDate?: string;

    @ApiProperty({ example: '00000000' })
    @IsString()
    number: string;

    @ApiProperty({ example: '2030-04-14' })
    @IsString()
    expiryDate: string;

    @ApiProperty({ example: 'ES' })
    @IsString()
    issuanceCountry: string;

    @ApiProperty({ example: 'ES' })
    @IsString()
    validityCountry: string;

    @ApiProperty({ example: 'ES' })
    @IsString()
    nationality: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    holder: boolean;
}

class AmadeusTravelerDto {
    @ApiProperty({ example: '1' })
    @IsString()
    id: string;

    @ApiProperty({ example: '1982-01-16' })
    @IsDateString()
    dateOfBirth: string;

    @ApiProperty()
    @ValidateNested()
    @Type(() => AmadeusTravelerNameDto)
    name: AmadeusTravelerNameDto;

    @ApiProperty({ enum: ['MALE', 'FEMALE'] })
    @IsEnum(['MALE', 'FEMALE'])
    gender: 'MALE' | 'FEMALE';

    @ApiPropertyOptional()
    @IsOptional()
    @ValidateNested()
    @Type(() => AmadeusTravelerContactDto)
    contact?: AmadeusTravelerContactDto;

    @ApiPropertyOptional({ type: [AmadeusTravelerDocumentDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AmadeusTravelerDocumentDto)
    documents?: AmadeusTravelerDocumentDto[];
}

export class AmadeusOrderDto {
    @ApiProperty({
        description: 'Wrapper containing the priced flight offer(s), travelers, and optional remarks/contacts',
    })
    @IsObject()
    data: {
        type: 'flight-order';
        flightOffers: any[];
        travelers: AmadeusTravelerDto[];
        remarks?: any;
        ticketingAgreement?: any;
        contacts?: any[];
    };
}
