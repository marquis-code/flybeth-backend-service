import { Controller, Get, Post, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { EsimsService } from "./esims.service";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("eSIMs")
@Controller("esims")
export class EsimsController {
  constructor(private readonly esimsService: EsimsService) {}

  @Public()
  @Get("packages")
  @ApiOperation({ summary: "Get available eSIM packages" })
  async getPackages(@Query() query: any) {
    return this.esimsService.getPackages(query);
  }

  @Post("orders")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Purchase an eSIM package" })
  async submitOrder(
    @CurrentUser("_id") userId: string,
    @Body() body: { packageId: string; quantity: number }
  ) {
    // In a real application, you would ensure the user has paid before submitting the order
    // to Airalo. For this implementation, we submit the order directly.
    return this.esimsService.submitOrder(body.packageId, body.quantity || 1, `User ${userId}`);
  }

  @Get("sims/:iccid/instructions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get installation instructions and QR code for an eSIM" })
  async getInstructions(
    @Param("iccid") iccid: string
  ) {
    return this.esimsService.getInstructions(iccid);
  }
}
