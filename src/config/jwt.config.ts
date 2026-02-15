// src/config/jwt.config.ts
import { ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleAsyncOptions = {
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'default-jwt-secret'),
        signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRY', '15m') as any,
        },
    }),
};
