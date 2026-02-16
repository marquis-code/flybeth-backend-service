// src/modules/integrations/providers/amadeus-base.provider.ts
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * Base class for all Amadeus providers.
 * Handles OAuth2 client_credentials authentication with auto-refresh.
 */
export abstract class AmadeusBaseProvider {
    protected readonly logger: Logger;
    protected httpClient: AxiosInstance;

    private accessToken: string | null = null;
    private tokenExpiresAt: number = 0;
    private clientId: string;
    private clientSecret: string;
    private baseUrl: string;

    constructor(
        protected configService: ConfigService,
        loggerContext: string,
    ) {
        this.logger = new Logger(loggerContext);
        this.clientId = this.configService.get<string>('app.amadeus.clientId', '');
        this.clientSecret = this.configService.get<string>('app.amadeus.clientSecret', '');
        this.baseUrl = this.configService.get<string>('app.amadeus.baseUrl', 'https://test.api.amadeus.com');

        this.httpClient = axios.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: { Accept: 'application/json' },
        });
    }

    /** Call in onModuleInit to pre-warm the token */
    protected async warmUpToken(): Promise<void> {
        if (this.clientId && this.clientSecret) {
            try {
                await this.authenticate();
                this.logger.log('Amadeus token acquired');
            } catch (err) {
                this.logger.warn(`Failed to acquire initial Amadeus token: ${err.message}`);
            }
        } else {
            this.logger.warn('Amadeus credentials not configured');
        }
    }

    get isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret);
    }

    // ─── Authentication ───

    private async authenticate(): Promise<void> {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', this.clientId);
        params.append('client_secret', this.clientSecret);

        const { data } = await this.httpClient.post(
            '/v1/security/oauth2/token',
            params.toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
        );

        this.accessToken = data.access_token;
        this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    }

    protected async getAuthHeaders(): Promise<Record<string, string>> {
        if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
            await this.authenticate();
        }
        return { Authorization: `Bearer ${this.accessToken}` };
    }

    // ─── HTTP Helpers ───

    protected async amadeusGet<T = any>(path: string, params?: Record<string, any>): Promise<T> {
        const headers = await this.getAuthHeaders();
        const { data } = await this.httpClient.get<T>(path, { headers, params });
        return data;
    }

    protected async amadeusPost<T = any>(path: string, body?: any, extraHeaders?: Record<string, string>): Promise<T> {
        const headers = await this.getAuthHeaders();
        const { data } = await this.httpClient.post<T>(path, body, {
            headers: { ...headers, 'Content-Type': 'application/json', ...extraHeaders },
        });
        return data;
    }

    protected async amadeusDelete<T = any>(path: string): Promise<T> {
        const headers = await this.getAuthHeaders();
        const { data } = await this.httpClient.delete<T>(path, { headers });
        return data;
    }

    // ─── Utility ───

    protected parseDuration(iso8601: string): number {
        const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (!match) return 0;
        return parseInt(match[1] || '0', 10) * 60 + parseInt(match[2] || '0', 10);
    }
}
