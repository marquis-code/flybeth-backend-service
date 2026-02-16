// src/modules/integrations/providers/amadeus-transfers.provider.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmadeusBaseProvider } from './amadeus-base.provider';

@Injectable()
export class AmadeusTransfersProvider extends AmadeusBaseProvider implements OnModuleInit {
    constructor(configService: ConfigService) {
        super(configService, AmadeusTransfersProvider.name);
    }

    async onModuleInit() { await this.warmUpToken(); }

    /** POST /v1/shopping/transfer-offers — Search transfer offers */
    async searchTransfers(body: any): Promise<any> {
        return this.amadeusPost('/v1/shopping/transfer-offers', body);
    }

    /** POST /v1/ordering/transfer-orders?offerId=... — Book a transfer */
    async bookTransfer(offerId: string, body: any): Promise<any> {
        return this.amadeusPost(`/v1/ordering/transfer-orders?offerId=${offerId}`, body);
    }

    /** POST /v1/ordering/transfer-orders/:orderId/transfers/cancellation — Cancel a transfer */
    async cancelTransfer(orderId: string, confirmNbr: string): Promise<any> {
        return this.amadeusPost(
            `/v1/ordering/transfer-orders/${orderId}/transfers/cancellation?confirmNbr=${confirmNbr}`,
        );
    }
}
