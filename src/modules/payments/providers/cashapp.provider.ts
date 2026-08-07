import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CashAppProvider {
  private readonly logger = new Logger(CashAppProvider.name);
  private readonly baseUrl = 'https://sandbox.api.cash.app'; // Sandbox by default for now
  private readonly clientId = process.env.CASHAPP_CLIENT_ID || 'client_id_placeholder';
  private readonly apiKey = process.env.CASHAPP_API_KEY || 'api_key_placeholder';
  private readonly apiSecret = process.env.CASHAPP_SECRET || 'secret_placeholder';
  private readonly merchantId = process.env.CASHAPP_MERCHANT_ID || 'merchant_id_placeholder';
  private readonly region = process.env.CASHAPP_REGION || 'PDX';

  /**
   * Generates the signature for a request to the Network API
   */
  private generateSignature(method: string, path: string, headers: Record<string, string>, body: any): string {
    // During local/sandbox testing, we can use the magic skip signature
    if (this.clientId === 'client_id_placeholder' || process.env.NODE_ENV !== 'production') {
      return 'sandbox:skip-signature-check';
    }

    const host = new URL(this.baseUrl).host;
    const accept = headers['accept'] || 'application/json';
    const auth = headers['authorization'];
    const contentType = headers['content-type'] || 'application/json';

    const headersString = `accept:${accept}\nauthorization:${auth}\ncontent-type:${contentType}\nhost:${host}`;

    let bodyDigest = '';
    if (body && Object.keys(body).length > 0) {
      bodyDigest = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex').toLowerCase();
    } else {
      bodyDigest = crypto.createHash('sha256').update('').digest('hex').toLowerCase();
    }

    const rawSignature = `${method.toUpperCase()}\n${path}\n${headersString}\n${bodyDigest}`;
    const hashedSignature = crypto.createHmac('sha256', this.apiSecret).update(rawSignature).digest('hex').toLowerCase();

    return `V1 ${hashedSignature}`;
  }

  async createPayment(options: {
    amount: number;
    currency: string;
    grantId: string;
    referenceId?: string;
  }) {
    try {
      const idempotencyKey = uuidv4();
      const path = '/network/v1/payments';
      const method = 'POST';

      // Amount is in cents for Cash App API
      const amountInCents = Math.round(options.amount * 100);

      const body = {
        payment: {
          capture: true,
          amount: amountInCents,
          currency: options.currency,
          merchant_id: this.merchantId,
          grant_id: options.grantId,
          reference_id: options.referenceId || idempotencyKey,
        },
        idempotency_key: idempotencyKey,
      };

      const authHeader = `Client ${this.clientId} ${this.apiKey}`;
      
      const headers: Record<string, string> = {
        'accept': 'application/json',
        'authorization': authHeader,
        'content-type': 'application/json',
        'x-region': this.region,
      };

      headers['x-signature'] = this.generateSignature(method, path, headers, body);

      const response = await axios.post(`${this.baseUrl}${path}`, body, { headers });

      return {
        status: response.data.payment?.state === 'APPROVED' ? 'success' : 'pending',
        data: response.data,
      };
    } catch (error: any) {
      this.logger.error('CashApp payment creation failed', error.response?.data || error.message);
      throw new BadRequestException('Payment with Cash App failed. Please try again.');
    }
  }
}
