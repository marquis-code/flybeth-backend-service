// src/config/app.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    throttle: {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    },
    amadeus: {
        clientId: process.env.AMADEUS_API_KEY || process.env.AMADEUS_CLIENT_ID || '',
        clientSecret: process.env.AMADEUS_API_SECRET || process.env.AMADEUS_CLIENT_SECRET || '',
        baseUrl: process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com',
    },
}));
