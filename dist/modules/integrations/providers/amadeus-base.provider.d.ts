import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance } from 'axios';
export declare abstract class AmadeusBaseProvider {
    protected configService: ConfigService;
    protected readonly logger: Logger;
    protected httpClient: AxiosInstance;
    private accessToken;
    private tokenExpiresAt;
    private clientId;
    private clientSecret;
    private baseUrl;
    constructor(configService: ConfigService, loggerContext: string);
    protected warmUpToken(): Promise<void>;
    get isConfigured(): boolean;
    private authenticate;
    protected getAuthHeaders(): Promise<Record<string, string>>;
    protected amadeusGet<T = any>(path: string, params?: Record<string, any>): Promise<T>;
    protected amadeusPost<T = any>(path: string, body?: any, extraHeaders?: Record<string, string>): Promise<T>;
    protected amadeusDelete<T = any>(path: string): Promise<T>;
    protected parseDuration(iso8601: string): number;
}
