// src/modules/experiences/experiences.module.ts
import { Module } from "@nestjs/common";
import { ExperiencesController } from "./experiences.controller";
import { IntegrationsModule } from "../integrations/integrations.module";

@Module({
  imports: [IntegrationsModule],
  controllers: [ExperiencesController],
  providers: [],
})
export class ExperiencesModule {}
