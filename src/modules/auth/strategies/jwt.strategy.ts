// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        configService: ConfigService,
        private usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'default-jwt-secret',
        });
    }

    async validate(payload: any) {
        try {
            const user = await this.usersService.findById(payload.sub);
            if (!user || !user.isActive) {
                throw new UnauthorizedException('User not found or inactive');
            }
            return user;
        } catch {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
