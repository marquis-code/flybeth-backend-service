import { Module, Global } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>("REDIS_HOST", "localhost"),
          port: configService.get<number>("REDIS_PORT", 6379),
          password: configService.get<string>("REDIS_PASSWORD", ""),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: "email-queue" },
      { name: "booking-queue" },
      { name: "fraud-queue" },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
