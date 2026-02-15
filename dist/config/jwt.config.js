"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtConfig = void 0;
const config_1 = require("@nestjs/config");
exports.jwtConfig = {
    inject: [config_1.ConfigService],
    useFactory: (configService) => ({
        secret: configService.get('JWT_SECRET', 'default-jwt-secret'),
        signOptions: {
            expiresIn: configService.get('JWT_EXPIRY', '15m'),
        },
    }),
};
//# sourceMappingURL=jwt.config.js.map