// src/modules/integrations/duffel-identity.controller.ts
import { Controller, Post, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { DuffelIdentityService } from "./duffel-identity.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Integrations / Duffel Identity")
@Controller("integrations/duffel/identity")
export class DuffelIdentityController {
  constructor(private readonly duffelIdentityService: DuffelIdentityService) {}

  @Post("setup")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Setup Duffel identity for the logged-in user",
    description: "Creates a Duffel Customer if it doesn't exist and returns a Client Key for frontend components.",
  })
  async setupIdentity(@Req() req: any) {
    const userId = req.user.id;
    const result = await this.duffelIdentityService.ensureIdentity(userId);
    return { success: true, ...result };
  }
}
