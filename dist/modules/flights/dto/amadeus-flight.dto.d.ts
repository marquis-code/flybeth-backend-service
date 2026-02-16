export declare class AmadeusSearchDto {
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children?: number;
    infants?: number;
    travelClass?: string;
    includedAirlineCodes?: string;
    excludedAirlineCodes?: string;
    nonStop?: boolean;
    currencyCode?: string;
    maxPrice?: number;
    max?: number;
}
export declare class AmadeusPriceDto {
    data: {
        type: 'flight-offers-pricing';
        flightOffers: any[];
    };
}
declare class AmadeusTravelerNameDto {
    firstName: string;
    lastName: string;
}
declare class AmadeusTravelerPhoneDto {
    deviceType: string;
    countryCallingCode: string;
    number: string;
}
declare class AmadeusTravelerContactDto {
    emailAddress: string;
    phones?: AmadeusTravelerPhoneDto[];
}
declare class AmadeusTravelerDocumentDto {
    documentType: string;
    birthPlace?: string;
    issuanceLocation?: string;
    issuanceDate?: string;
    number: string;
    expiryDate: string;
    issuanceCountry: string;
    validityCountry: string;
    nationality: string;
    holder: boolean;
}
declare class AmadeusTravelerDto {
    id: string;
    dateOfBirth: string;
    name: AmadeusTravelerNameDto;
    gender: 'MALE' | 'FEMALE';
    contact?: AmadeusTravelerContactDto;
    documents?: AmadeusTravelerDocumentDto[];
}
export declare class AmadeusOrderDto {
    data: {
        type: 'flight-order';
        flightOffers: any[];
        travelers: AmadeusTravelerDto[];
        remarks?: any;
        ticketingAgreement?: any;
        contacts?: any[];
    };
}
export {};
