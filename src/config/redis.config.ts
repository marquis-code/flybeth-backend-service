// src/config/redis.config.ts
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';

export const cacheConfig = async (configService: ConfigService) => ({
    store: await redisStore({
        host: configService.get<string>('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        password: configService.get<string>('REDIS_PASSWORD', ''),
        ttl: configService.get<number>('REDIS_TTL', 300) * 1000,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
    }),
});
