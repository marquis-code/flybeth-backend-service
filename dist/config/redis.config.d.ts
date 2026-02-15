import { ConfigService } from '@nestjs/config';
export declare const cacheConfig: (configService: ConfigService) => Promise<{
    store: import("cache-manager-ioredis-yet").RedisStore;
}>;
