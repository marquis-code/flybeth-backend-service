// src/modules/integrations/providers/sabre-helper.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SabreHelperService {
    private readonly logger = new Logger(SabreHelperService.name);
    private accessToken: string | null = null;
    private tokenExpiresAt: number = 0;

    readonly baseUrl: string;
    private readonly clientId: string;
    private readonly clientSecret: string;

    constructor(private configService: ConfigService) {
        this.baseUrl =
            this.configService.get<string>("SABRE_BASE_URL") ||
            "https://api.cert.platform.sabre.com"; // Default to cert/test
        this.clientId = this.configService.get<string>("SABRE_CLIENT_ID") || "";
        this.clientSecret = this.configService.get<string>("SABRE_CLIENT_SECRET") || "";
    }

    /**
     * Fetch OAuth2 access token from Sabre
     */
    async getAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
            return this.accessToken;
        }

        this.logger.debug("Fetching new Sabre access token...");

        try {
            const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

            const response = await fetch(`${this.baseUrl}/v2/auth/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Basic ${basicAuth}`,
                },
                body: new URLSearchParams({
                    grant_type: "client_credentials",
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(
                    `Sabre auth failed: ${response.status} ${errorText}`,
                );
                throw new Error(`Sabre authentication failed: ${response.status}`);
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            // data.expires_in is in seconds
            this.tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
            this.logger.debug("Sabre access token obtained");
            return this.accessToken!;
        } catch (error) {
            this.logger.error(`Sabre auth error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Helper to format time for Sabre (HH:mm)
     */
    formatTime(time: string): string {
        // Sabre sometimes expects HH:mm or HHmm depending on V1/V2
        return time.replace(":", "");
    }

    /**
     * Helper to format date for Sabre (YYYY-MM-DD)
     */
    formatDate(date: string): string {
        return date; // Assuming input is already YYYY-MM-DD
    }
}
