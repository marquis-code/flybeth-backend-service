import { Module } from "@nestjs/common";
import { VoiceAgentController } from "./voice-agent.controller";
import { VoiceAgentService } from "./voice-agent.service";
import { AssemblyAIService } from "./assembly-ai.service";
import { VoiceBookingGateway } from "./voice-booking.gateway";
import { VoiceBookingService } from "./voice-booking.service";
import { IntegrationsModule } from "../integrations/integrations.module";
import { BookingsModule } from "../bookings/bookings.module";

import { JwtModule } from "@nestjs/jwt";
import { jwtConfig } from "../../config/jwt.config";

@Module({
  imports: [
    IntegrationsModule,
    BookingsModule,
    JwtModule.registerAsync(jwtConfig),
  ],
  controllers: [VoiceAgentController],
  providers: [
    VoiceAgentService,
    AssemblyAIService,
    VoiceBookingGateway,
    VoiceBookingService,
  ],
})
export class VoiceAgentModule {}
