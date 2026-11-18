// src/config/redis.config.ts
import { ConfigService } from "@nestjs/config";
import { redisStore } from "cache-manager-ioredis-yet";

export const cacheConfig = async (configService: ConfigService) => {
  const host = configService.get<string>("REDIS_HOST");
  const redisUrl = configService.get<string>("REDIS_URL");
  const port = configService.get<number>("REDIS_PORT", 6379);
  const password = configService.get<string>("REDIS_PASSWORD", "");
  const ttl = configService.get<number>("REDIS_TTL", 300) * 1000;

  // If no external Redis URL or explicit non-localhost host is configured,
  // use in-memory store directly to eliminate 15-second localhost socket hangs
  if (!redisUrl && (!host || host === "localhost" || host === "127.0.0.1")) {
    return { ttl };
  }

  try {
    const store = await redisStore({
      ...(redisUrl ? { url: redisUrl } : { host, port, password }),
      ttl,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy: () => null,
    });
    return { store };
  } catch (err: any) {
    console.warn(`[RedisConfig] Failed to initialize Redis store (${err?.message || err}). Falling back to memory store.`);
    return { ttl };
  }
};
