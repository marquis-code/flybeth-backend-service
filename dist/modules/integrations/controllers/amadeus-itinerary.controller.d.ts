import { AmadeusItineraryProvider } from '../providers/amadeus-itinerary.provider';
export declare class AmadeusItineraryController {
    private readonly provider;
    constructor(provider: AmadeusItineraryProvider);
    tripPurpose(originLocationCode: string, destinationLocationCode: string, departureDate: string, returnDate: string): Promise<any>;
}
