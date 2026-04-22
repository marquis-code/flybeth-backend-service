import { Module } from "@nestjs/common";
import { CurrencyController } from "./currency.controller";
import { CurrencyService } from "./currency.service";
import { SystemConfigModule } from "../system-config/system-config.module";

@Module({
  imports: [
    SystemConfigModule,
  ],
  controllers: [CurrencyController],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
