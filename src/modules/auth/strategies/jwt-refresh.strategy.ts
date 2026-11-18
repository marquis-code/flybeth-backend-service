// src/modules/auth/strategies/jwt-refresh.strategy.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../../users/users.service";
import { Request } from "express";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  "jwt-refresh",
) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Cookie-based (primary for same-domain)
        (request: Request) => request?.cookies?.refreshToken || null,
        // 2. Custom header (resilient for cross-domain / CORS)
        (request: Request) => (request?.headers?.['x-refresh-token'] as string) || null,
        // 3. Authorization Bearer header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // 4. Body field (last resort)
        (request: Request) => (request?.body as any)?.refreshToken || null,
      ]),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey:
        configService.get<string>("JWT_REFRESH_SECRET") ||
        "default-refresh-secret",
    });
  }

  async validate(req: Request, payload: any) {
    try {
      const user = await this.usersService.findByIdWithRefreshToken(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException("User not found or account is deactivated");
      }

      // Extract incoming token from cookies, headers, or body
      const incomingToken =
        req?.cookies?.refreshToken ||
        (req?.headers?.["x-refresh-token"] as string) ||
        (req?.body as any)?.refreshToken ||
        req?.headers?.authorization?.replace(/^Bearer\s+/i, "");

      // Security: Validate that the presented token strictly matches the active DB session
      if (!user.refreshToken || (incomingToken && user.refreshToken !== incomingToken)) {
        throw new UnauthorizedException(
          "Session token has been revoked, rotated, or logged out. Please sign in again.",
        );
      }

      return user;
    } catch (err: any) {
      throw new UnauthorizedException(err?.message || "Invalid refresh token");
    }
  }
}
