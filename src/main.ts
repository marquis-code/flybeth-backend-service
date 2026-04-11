// src/main.ts
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import compression from "compression";
import helmet from "helmet";
import { AppModule } from "./app.module";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe webhooks
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3000);
  const apiPrefix = configService.get<string>("API_PREFIX", "api/v1");

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Aggressive Route Fix: Handle requests missing the prefix
  app.use((req, res, next) => {
    const url = req.url;
    const modulesRequiringPrefix = [
      "/upload",
      "/payments",
      "/market-insights",
      "/flights",
      "/stays",
      "/auth",
      "/users",
      "/bookings",
    ];

    const needsPrefix =
      modulesRequiringPrefix.some((path) => url.startsWith(path)) &&
      !url.startsWith(`/${apiPrefix}`);

    if (needsPrefix) {
      req.url = `/${apiPrefix}${url}`;
      Logger.warn(
        `Aggressive Route Fix: Redirecting ${url} to ${req.url}`,
        "Bootstrap",
      );
    }
    next();
  });

  // Security middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    }),
  );
  app.use(compression());
  app.use(cookieParser());

  // CORS - Aggressive settings for production and development
  app.enableCors({
    origin: (origin, callback) => callback(null, true),
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Accept",
      "Authorization",
      "X-Tenant-ID",
      "X-Requested-With",
      "x-captcha-token",
    ],
    exposedHeaders: ["set-cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Relaxed to avoid 400s from cache-busters or extra query params
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle("✈️ Flight Booking API")
    .setDescription(
      `
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
      `,
    )
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("Auth", "Authentication & Authorization")
    .addTag("Users", "User Management")
    .addTag("Flights", "Flight Search & Management")
    .addTag("Bookings", "Booking Management")
    .addTag("Payments", "Payment Processing")
    .addTag("Tenants", "Tenant Management")
    .addTag("Passengers", "Traveler Profiles")
    .addTag("Airports & Airlines", "Airport & Airline Data")
    .addTag("Currency", "Exchange Rates & Conversion")
    .addTag("Notifications", "User Notifications")
    .addTag("Upload", "File Management")
    .addTag("Admin", "Admin Dashboard")
    .addTag("Analytics", "Business Analytics")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document, {
    customSiteTitle: "Flight Booking API - Swagger",
    customCss: `
      .swagger-ui .topbar { background-color: #003580; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
    `,
  });

  try {
    await app.listen(port);
    logger.log(`🚀 Server running on http://localhost:${port}`);
    logger.log(`📋 Swagger docs at http://localhost:${port}/docs`);
    logger.log(`🔧 API prefix: ${apiPrefix}`);
    logger.log(
      `🌍 Environment: ${configService.get("NODE_ENV", "development")}`,
    );
  } catch (error) {
    if (error.code === "EADDRINUSE") {
      logger.error(
        `❌ Port ${port} is already in use. Attempting aggressive recovery...`,
      );
      // The prestart script in package.json should handle this,
      // but we add this log for visibility.
    }
    throw error;
  }
}

bootstrap();
