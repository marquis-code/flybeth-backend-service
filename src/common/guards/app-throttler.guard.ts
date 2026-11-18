import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ThrottlerGuard, ThrottlerLimitDetail } from "@nestjs/throttler";
import { Request } from "express";

/**
 * Enterprise-grade Throttler Guard for Flybeth.
 * - Extracts authentic client IP across Cloudflare, Railway, and reverse proxy chains.
 * - Excludes critical payment and supplier webhooks from rate limiting.
 * - Enforces tiered security limits (Auth, Payment, Search, Global) with clear 429 errors.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(AppThrottlerGuard.name);

  /**
   * Aggressively resolve client IP across reverse proxies:
   * Cloudflare (`cf-connecting-ip`), Nginx/Railway/Traefik (`x-real-ip`, `x-forwarded-for`),
   * and socket fallback.
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const headers = req.headers || {};

    const cfIp = headers["cf-connecting-ip"];
    if (typeof cfIp === "string" && cfIp.trim()) {
      return cfIp.trim();
    }

    const xRealIp = headers["x-real-ip"];
    if (typeof xRealIp === "string" && xRealIp.trim()) {
      return xRealIp.trim();
    }

    const xff = headers["x-forwarded-for"];
    if (typeof xff === "string" && xff.trim()) {
      const clientIp = xff.split(",")[0].trim();
      if (clientIp) return clientIp;
    }

    return (
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      "127.0.0.1"
    );
  }

  /**
   * Skip non-actionable or external provider callback endpoints.
   */
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req) return false;

    const method = req.method ? req.method.toUpperCase() : "";
    // Always skip CORS preflight OPTIONS requests
    if (method === "OPTIONS") return true;

    const path = (req.path || req.url || "").toLowerCase();

    // Critical: Never throttle payment gateways or supplier webhooks
    const webhookKeywords = [
      "/webhook",
      "webhook",
      "/duffel-webhook",
      "/stripe/webhook",
      "/paystack/webhook",
      "/paypal/webhook",
    ];
    if (webhookKeywords.some((keyword) => path.includes(keyword))) {
      return true;
    }

    // Never throttle system health checks or keepalives
    if (
      path === "/" ||
      path === "/health" ||
      path === "/api/v1/health" ||
      path.endsWith("/health")
    ) {
      return true;
    }

    return false;
  }

  /**
   * Throw a standardized, structured 429 exception with actionable security details.
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse();
    const tracker = await this.getTracker(req);
    const retryAfter = throttlerLimitDetail.timeToBlockExpire || 60;

    this.logger.warn(
      `[SECURITY ALERT] Rate limit exceeded on [${req.method}] ${req.url} from IP: ${tracker}. Limit: ${throttlerLimitDetail.limit}. Retry-After: ${retryAfter}s.`,
    );

    if (res && typeof res.header === "function") {
      res.header("Retry-After", String(retryAfter));
      res.header("X-RateLimit-Limit", String(throttlerLimitDetail.limit));
      res.header("X-RateLimit-Remaining", "0");
    }

    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message:
          "Too many requests. For security reasons, please slow down and try again in a few moments.",
        error: "Too Many Requests",
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
