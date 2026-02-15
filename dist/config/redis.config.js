"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheConfig = void 0;
const cache_manager_ioredis_yet_1 = require("cache-manager-ioredis-yet");
const cacheConfig = async (configService) => ({
    store: await (0, cache_manager_ioredis_yet_1.redisStore)({
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD', ''),
        ttl: configService.get('REDIS_TTL', 300) * 1000,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
    }),
});
exports.cacheConfig = cacheConfig;
//# sourceMappingURL=redis.config.js.map