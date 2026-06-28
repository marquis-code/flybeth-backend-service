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
      secretOrKey:
        configService.get<string>("JWT_REFRESH_SECRET") ||
        "default-refresh-secret",
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }
      return user;
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }
}
