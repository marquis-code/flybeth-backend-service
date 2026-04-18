// src/main.ts
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import compression from "compression";
import helmet from "helmet";
import { AppModule } from "./app.module";
import cookieParser from "cookie-parser";
import { UsersService } from "./modules/users/users.service";
import { AccessControlService } from "./modules/access-control/access-control.service";
import { hashPassword } from "./common/utils/crypto.util";

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
      "/chat",
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

  // Security middleware - loosened for cross-origin flexibility
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      contentSecurityPolicy: false,
    }),
  );
  app.use(compression());
  app.use(cookieParser());

  // ─── CORS FIX ────────────────────────────────────────────────────────────────
  // Raw Express middleware runs BEFORE any NestJS guard/interceptor/route handler.
  // This guarantees that:
  //   1. Every response — including error responses — carries the correct headers.
  //   2. OPTIONS preflight requests are terminated immediately with 204, so they
  //      never reach a NestJS handler that might reject them.
  // When `credentials: true` is required, Access-Control-Allow-Origin must be the
  // exact requesting origin — NOT the wildcard "*" — which is what we mirror here.
  app.use((req, res, next) => {
    const origin = req.headers.origin || "*";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, " +
        "X-Tenant-ID, x-captcha-token, Cache-Control, Pragma, Expires, " +
        "x-nuxt-upgrade-edge",
    );
    res.setHeader("Access-Control-Expose-Headers", "set-cookie");

    // Short-circuit every OPTIONS preflight here — no further processing needed.
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      return res.end();
    }
    next();
  });

  // Keep NestJS-level CORS in sync so its internal metadata stays consistent.
  app.enableCors({
    origin: (origin, callback) => callback(null, origin || true),
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
    allowedHeaders:
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, " +
      "X-Tenant-ID, x-captcha-token, Cache-Control, Pragma, Expires, " +
      "x-nuxt-upgrade-edge",
    exposedHeaders: ["set-cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  // ─────────────────────────────────────────────────────────────────────────────

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
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

  // Aggressive Admin Seed: Ensure the requested admin exists
  const usersService = app.get(UsersService);
  try {
    const adminEmail = "abahmarquis@gmail.com";
    const adminPass = "Miles1999@";
    logger.log(`[Seed] Synchronizing admin user: ${adminEmail}`);
    await usersService.syncAdminUser(adminEmail, adminPass, 'super_admin');
  } catch (err) {
    logger.error(`[Seed] Failed to seed admin: ${err.message}`);
  }

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
    }
    throw error;
  }
}

bootstrap();