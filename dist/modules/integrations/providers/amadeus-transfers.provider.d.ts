import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmadeusBaseProvider } from './amadeus-base.provider';
export declare class AmadeusTransfersProvider extends AmadeusBaseProvider implements OnModuleInit {
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    searchTransfers(body: any): Promise<any>;
    bookTransfer(offerId: string, body: any): Promise<any>;
    cancelTransfer(orderId: string, confirmNbr: string): Promise<any>;
}
