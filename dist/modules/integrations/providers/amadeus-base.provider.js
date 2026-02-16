"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmadeusBaseProvider = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
class AmadeusBaseProvider {
    constructor(configService, loggerContext) {
        this.configService = configService;
        this.accessToken = null;
        this.tokenExpiresAt = 0;
        this.logger = new common_1.Logger(loggerContext);
        this.clientId = this.configService.get('app.amadeus.clientId', '');
        this.clientSecret = this.configService.get('app.amadeus.clientSecret', '');
        this.baseUrl = this.configService.get('app.amadeus.baseUrl', 'https://test.api.amadeus.com');
        this.httpClient = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: { Accept: 'application/json' },
        });
    }
    async warmUpToken() {
        if (this.clientId && this.clientSecret) {
            try {
                await this.authenticate();
                this.logger.log('Amadeus token acquired');
            }
            catch (err) {
                this.logger.warn(`Failed to acquire initial Amadeus token: ${err.message}`);
            }
        }
        else {
            this.logger.warn('Amadeus credentials not configured');
        }
    }
    get isConfigured() {
        return !!(this.clientId && this.clientSecret);
    }
    async authenticate() {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', this.clientId);
        params.append('client_secret', this.clientSecret);
        const { data } = await this.httpClient.post('/v1/security/oauth2/token', params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        this.accessToken = data.access_token;
        this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    }
    async getAuthHeaders() {
        if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
            await this.authenticate();
        }
        return { Authorization: `Bearer ${this.accessToken}` };
    }
    async amadeusGet(path, params) {
        const headers = await this.getAuthHeaders();
        const { data } = await this.httpClient.get(path, { headers, params });
        return data;
    }
    async amadeusPost(path, body, extraHeaders) {
        const headers = await this.getAuthHeaders();
        const { data } = await this.httpClient.post(path, body, {
            headers: { ...headers, 'Content-Type': 'application/json', ...extraHeaders },
        });
        return data;
    }
    async amadeusDelete(path) {
        const headers = await this.getAuthHeaders();
        const { data } = await this.httpClient.delete(path, { headers });
        return data;
    }
    parseDuration(iso8601) {
        const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (!match)
            return 0;
        return parseInt(match[1] || '0', 10) * 60 + parseInt(match[2] || '0', 10);
    }
}
exports.AmadeusBaseProvider = AmadeusBaseProvider;
//# sourceMappingURL=amadeus-base.provider.js.map