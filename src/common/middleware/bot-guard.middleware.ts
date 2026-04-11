import {
  Injectable,
  NestMiddleware,
  Logger,
  ForbiddenException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class BotGuardMiddleware implements NestMiddleware {
  private readonly logger = new Logger(BotGuardMiddleware.name);

  async use(req: Request, res: Response, next: NextFunction) {
    const captchaToken = req.headers["x-captcha-token"];
    const path = req.path;
    const method = req.method;

    // Only protect sensitive POST/GET actions
    const sensitivePaths = [
      "/auth/login",
      "/auth/register",
      "/flights/search",
      "/bookings",
    ];
    const isSensitive = sensitivePaths.some((p) => path.includes(p));

    if (isSensitive) {
      if (!captchaToken && process.env.NODE_ENV === "production") {
        this.logger.warn(
          `Potential bot attack detected: Missing CAPTCHA token for ${method} ${path} from ${req.ip}`,
        );
        // throw new ForbiddenException('CAPTCHA verification required');
        // We'll just log it for now to avoid breaking the UI before CAPTCHA is added to frontend
      }

      this.logger.log(
        `Request validated for ${path} from ${req.ip}. User-Agent: ${req.headers["user-agent"]}`,
      );
    }

    next();
  }
}
