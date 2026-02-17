"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const cache_manager_1 = require("@nestjs/cache-manager");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const app_config_1 = __importDefault(require("./config/app.config"));
const database_config_1 = require("./config/database.config");
const redis_config_1 = require("./config/redis.config");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const timeout_interceptor_1 = require("./common/interceptors/timeout.interceptor");
const jwt_auth_guard_1 = require("./modules/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const tenants_module_1 = require("./modules/tenants/tenants.module");
const flights_module_1 = require("./modules/flights/flights.module");
const bookings_module_1 = require("./modules/bookings/bookings.module");
const payments_module_1 = require("./modules/payments/payments.module");
const passengers_module_1 = require("./modules/passengers/passengers.module");
const airports_module_1 = require("./modules/airports/airports.module");
const currency_module_1 = require("./modules/currency/currency.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const upload_module_1 = require("./modules/upload/upload.module");
const admin_module_1 = require("./modules/admin/admin.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const scheduler_module_1 = require("./modules/scheduler/scheduler.module");
const seed_module_1 = require("./modules/seed/seed.module");
const chat_module_1 = require("./modules/chat/chat.module");
const stays_module_1 = require("./modules/stays/stays.module");
const tracking_module_1 = require("./modules/tracking/tracking.module");
const integrations_module_1 = require("./modules/integrations/integrations.module");
const packages_module_1 = require("./modules/packages/packages.module");
const cars_module_1 = require("./modules/cars/cars.module");
const cruises_module_1 = require("./modules/cruises/cruises.module");
const voice_agent_module_1 = require("./modules/voice-agent/voice-agent.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [app_config_1.default],
                envFilePath: '.env',
            }),
            mongoose_1.MongooseModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: database_config_1.databaseConfig,
            }),
            cache_manager_1.CacheModule.registerAsync({
                isGlobal: true,
                inject: [config_1.ConfigService],
                useFactory: redis_config_1.cacheConfig,
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    throttlers: [
                        {
                            ttl: configService.get('app.throttle.ttl', 60000),
                            limit: configService.get('app.throttle.limit', 100),
                        },
                    ],
                }),
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            tenants_module_1.TenantsModule,
            flights_module_1.FlightsModule,
            bookings_module_1.BookingsModule,
            payments_module_1.PaymentsModule,
            passengers_module_1.PassengersModule,
            airports_module_1.AirportsModule,
            currency_module_1.CurrencyModule,
            notifications_module_1.NotificationsModule,
            upload_module_1.UploadModule,
            admin_module_1.AdminModule,
            analytics_module_1.AnalyticsModule,
            chat_module_1.ChatModule,
            stays_module_1.StaysModule,
            tracking_module_1.TrackingModule,
            integrations_module_1.IntegrationsModule,
            packages_module_1.PackagesModule,
            cars_module_1.CarsModule,
            cruises_module_1.CruisesModule,
            voice_agent_module_1.VoiceAgentModule,
            scheduler_module_1.SchedulerModule,
            seed_module_1.SeedModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
            { provide: core_1.APP_FILTER, useClass: all_exceptions_filter_1.AllExceptionsFilter },
            { provide: core_1.APP_INTERCEPTOR, useClass: transform_interceptor_1.TransformInterceptor },
            { provide: core_1.APP_INTERCEPTOR, useClass: logging_interceptor_1.LoggingInterceptor },
            { provide: core_1.APP_INTERCEPTOR, useClass: timeout_interceptor_1.TimeoutInterceptor },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map