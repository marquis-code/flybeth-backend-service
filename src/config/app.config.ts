// src/config/app.config.ts
import { registerAs } from "@nestjs/config";

export default registerAs("app", () => {
  const rawTtl = parseInt(process.env.THROTTLE_TTL || "60", 10);
  const ttlMs = rawTtl <= 1000 ? rawTtl * 1000 : rawTtl;

  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3000", 10),
    apiPrefix: process.env.API_PREFIX || "api/v1",
    throttle: {
      ttl: ttlMs,
      limit: parseInt(process.env.THROTTLE_LIMIT || "100", 10),
      authLimit: parseInt(process.env.THROTTLE_AUTH_LIMIT || "10", 10),
      searchLimit: parseInt(process.env.THROTTLE_SEARCH_LIMIT || "30", 10),
      paymentLimit: parseInt(process.env.THROTTLE_PAYMENT_LIMIT || "15", 10),
    },
  };
});
