// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.create(AppModule, {
        rawBody: true, // Required for Stripe webhooks
    });

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 3000);
    const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

    // Global prefix
    app.setGlobalPrefix(apiPrefix);

    // Security middleware
    app.use(helmet());
    app.use(compression());

    // CORS
    app.enableCors({
        origin: configService.get<string>('CORS_ORIGINS', '*').split(','),
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type,Accept,Authorization,X-Tenant-ID',
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Swagger API documentation
    const swaggerConfig = new DocumentBuilder()
        .setTitle('✈️ Flight Booking API')
        .setDescription(
            `
      ## Multi-Tenant Flight Booking Platform API
      
      A scalable flight booking backend with:
      - **Multi-tenancy** (B2B & B2C)
      - **Multi-currency** support (14 currencies)
      - **Dual payment** processing (Stripe + Paystack)
      - **Real-time** seat availability
      - **Admin analytics** and reporting
      - **Global Travel Integration** (Amadeus Search, Price, Booking)
      
      ### Amadeus API Modules
      This platform integrates the following Amadeus modules:
      - **Flights**: Live search, pricing, and orders (31 endpoints)
      - **Hotels**: Search, offers, and bookings (10 endpoints)
      - **Experiences**: Tours, activities, and city search (4 endpoints)
      - **Transfers**: Cars and transfers search/booking (3 endpoints)
      - **Insights**: Market trends and traffic analytics (3 endpoints)
      - **Itinerary**: Travel predictions and planning (1 endpoint)
      
      ### Authentication
      All protected endpoints require a Bearer JWT token.
      Use \`/auth/login\` to obtain tokens.
      
      ### Rate Limiting
      API requests are rate-limited to 100 requests per minute per IP.
      `,
        )
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('Auth', 'Authentication & Authorization')
        .addTag('Users', 'User Management')
        .addTag('Flights', 'Local & Amadeus Flight Operations')
        .addTag('Amadeus — Flight Booking', 'Real-time flights via Amadeus GDS')
        .addTag('Amadeus — Destination Experiences', 'Tours, activities, and city search')
        .addTag('Amadeus — Cars & Transfers', 'Transfer offers and bookings')
        .addTag('Amadeus — Market Insights', 'Travel analytics and traffic metrics')
        .addTag('Amadeus — Hotels', 'Hotel search, offers, and orders')
        .addTag('Amadeus — Itinerary Management', 'Travel predictions and purpose')
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

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    // Export swagger spec for frontend engineers
    const fs = require('fs');
    const path = require('path');
    fs.writeFileSync(
        path.join(__dirname, '..', 'swagger-spec.json'),
        JSON.stringify(document, null, 2),
    );

    SwaggerModule.setup('docs', app, document, {
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
