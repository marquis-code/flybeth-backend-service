// src/app.module.ts
import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { CacheModule } from "@nestjs/cache-manager";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";

// Config
import appConfig from "./config/app.config";
import { databaseConfig } from "./config/database.config";
import { cacheConfig } from "./config/redis.config";

// Common
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TimeoutInterceptor } from "./common/interceptors/timeout.interceptor";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { BotGuardMiddleware } from "./common/middleware/bot-guard.middleware";

// Feature Modules
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { FlightsModule } from "./modules/flights/flights.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { PassengersModule } from "./modules/passengers/passengers.module";
import { AirportsModule } from "./modules/airports/airports.module";
import { CurrencyModule } from "./modules/currency/currency.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { UploadModule } from "./modules/upload/upload.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { SchedulerModule } from "./modules/scheduler/scheduler.module";
import { SeedModule } from "./modules/seed/seed.module";

import { ChatModule } from "./modules/chat/chat.module";
import { StaysModule } from "./modules/stays/stays.module";
import { TrackingModule } from "./modules/tracking/tracking.module";
import { IntegrationsModule } from "./modules/integrations/integrations.module";
import { PackagesModule } from "./modules/packages/packages.module";
import { CarsModule } from "./modules/cars/cars.module";
import { CruisesModule } from "./modules/cruises/cruises.module";
import { StaffModule } from "./modules/staff/staff.module";
import { TransfersModule } from "./modules/transfers/transfers.module";
import { ExperiencesModule } from "./modules/experiences/experiences.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuditInterceptor } from "./modules/audit/audit.interceptor";
import { VoiceAgentModule } from "./modules/voice-agent/voice-agent.module";
import { QueueModule } from "./modules/queue/queue.module";
import { FraudModule } from "./modules/fraud/fraud.module";
import { SystemConfigModule } from "./modules/system-config/system-config.module";
import { AccessControlModule } from "./modules/access-control/access-control.module";
import { MarketingModule } from "./modules/marketing/marketing.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { ItinerariesModule } from "./modules/itineraries/itineraries.module";
import { SupportModule } from "./modules/support/support.module";
import { AppController } from "./app.controller";

@Module({
  controllers: [AppController],
  imports: [
    // Global Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ".env",
    }),

    // Database (MongoDB)
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),

    // Caching (Redis)
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: cacheConfig,
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>("app.throttle.ttl", 60000),
            limit: configService.get<number>("app.throttle.limit", 100),
          },
        ],
      }),
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    TenantsModule,
    FlightsModule,
    BookingsModule,
    PaymentsModule,
    PassengersModule,
    AirportsModule,
    CurrencyModule,
    NotificationsModule,
    UploadModule,
    AdminModule,
    AnalyticsModule,
    ChatModule,
    StaysModule,
    TrackingModule,
    IntegrationsModule,
    PackagesModule,
    CarsModule,
    CruisesModule,
    StaffModule,
    TransfersModule,
    ExperiencesModule,
    AuditModule,
    VoiceAgentModule,
    FraudModule,
    SystemConfigModule,
    AccessControlModule,
    MarketingModule,
    FinanceModule,
    ItinerariesModule,
    SupportModule,

    // Infrastructure
    QueueModule,
    SchedulerModule,
    SeedModule,
  ],
  providers: [
    // Global JWT guard (applies to all routes, @Public() decorator skips)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Global rate limiting
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Global roles guard
    { provide: APP_GUARD, useClass: RolesGuard },
    // Global exception filter
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Global interceptors
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BotGuardMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
