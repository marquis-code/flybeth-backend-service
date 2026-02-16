import { AmadeusTransfersProvider } from '../providers/amadeus-transfers.provider';
export declare class AmadeusTransfersController {
    private readonly provider;
    constructor(provider: AmadeusTransfersProvider);
    search(body: any): Promise<any>;
    book(offerId: string, body: any): Promise<any>;
    cancel(orderId: string, confirmNbr: string): Promise<any>;
}
