import { Controller, Post, UseGuards } from "@nestjs/common";
import { VoiceAgentService } from "./voice-agent.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Voice Agent")
@Controller("voice-agent")
export class VoiceAgentController {
  constructor(private readonly voiceAgentService: VoiceAgentService) {}

  @Public() // Making it public for easy initial integration, change to @UseGuards(JwtAuthGuard) if needed
  @Post("session")
  @ApiOperation({ summary: "Create a new voice agent session" })
  @ApiResponse({ status: 201, description: "Session created successfully." })
  async createSession() {
    return this.voiceAgentService.createSession();
  }
}
