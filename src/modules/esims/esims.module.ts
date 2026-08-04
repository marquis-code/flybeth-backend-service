import { Module } from "@nestjs/common";
import { EsimsController } from "./esims.controller";
import { EsimsService } from "./esims.service";
import { IntegrationsModule } from "../integrations/integrations.module";
import { AiraloProvider } from "../integrations/providers/airalo.provider";

@Module({
  imports: [IntegrationsModule],
  controllers: [EsimsController],
  providers: [EsimsService, AiraloProvider],
  exports: [EsimsService],
})
export class EsimsModule {}
