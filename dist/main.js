"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
    });
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 3000);
    const apiPrefix = configService.get('API_PREFIX', 'api/v1');
    app.setGlobalPrefix(apiPrefix);
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    app.enableCors({
        origin: configService.get('CORS_ORIGINS', '*').split(','),
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type,Accept,Authorization,X-Tenant-ID',
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('✈️ Flight Booking API')
        .setDescription(`
      ## Multi-Tenant Flight Booking Platform API
      
      A scalable flight booking backend with:
      - **Multi-tenancy** (B2B & B2C)
      - **Multi-currency** support (14 currencies)
      - **Dual payment** processing (Stripe + Paystack)
      - **Real-time** seat availability
      - **Admin analytics** and reporting
      
      ### Authentication
      All protected endpoints require a Bearer JWT token.
      Use \`/auth/login\` to obtain tokens.
      
      ### Rate Limiting
      API requests are rate-limited to 100 requests per minute per IP.
      `)
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('Auth', 'Authentication & Authorization')
        .addTag('Users', 'User Management')
        .addTag('Flights', 'Flight Search & Management')
        .addTag('Bookings', 'Booking Management')
        .addTag('Payments', 'Payment Processing')
        .addTag('Tenants', 'Tenant Management')
        .addTag('Passengers', 'Traveler Profiles')
        .addTag('Airports & Airlines', 'Airport & Airline Data')
        .addTag('Currency', 'Exchange Rates & Conversion')
        .addTag('Notifications', 'User Notifications')
        .addTag('Upload', 'File Management')
        .addTag('Admin', 'Admin Dashboard')
        .addTag('Analytics', 'Business Analytics')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('docs', app, document, {
        customSiteTitle: 'Flight Booking API - Swagger',
        customCss: `
      .swagger-ui .topbar { background-color: #003580; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
    `,
    });
    await app.listen(port);
    logger.log(`🚀 Server running on http://localhost:${port}`);
    logger.log(`📋 Swagger docs at http://localhost:${port}/docs`);
    logger.log(`🔧 API prefix: ${apiPrefix}`);
    logger.log(`🌍 Environment: ${configService.get('NODE_ENV', 'development')}`);
}
bootstrap();
//# sourceMappingURL=main.js.map