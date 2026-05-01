// src/modules/integrations/duffel-identity.controller.ts
import { Controller, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { DuffelIdentityService } from "./duffel-identity.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Integrations / Duffel Identity")
@Controller("integrations/duffel/identity")
export class DuffelIdentityController {
  constructor(private readonly duffelIdentityService: DuffelIdentityService) {}

  @Public()
  @Post("setup")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Setup Duffel identity for the user (supports guest)",
    description: "Creates a Duffel Customer if it doesn't exist and returns a Client Key for frontend components.",
  })
  async setupIdentity(@CurrentUser("_id") userId: string, @Body() body: any) {
    const result = await this.duffelIdentityService.ensureIdentity(userId, body?.data);
    return { success: true, ...result };
  }
}
