// src/modules/transfers/transfers.module.ts
import { Module } from "@nestjs/common";
import { TransfersController } from "./transfers.controller";
import { IntegrationsModule } from "../integrations/integrations.module";

@Module({
  imports: [IntegrationsModule],
  controllers: [TransfersController],
  providers: [],
})
export class TransfersModule {}
