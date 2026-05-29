import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Req, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { DuffelWebhooksService } from "./duffel-webhooks.service";
import { Request } from "express";

@ApiTags("Integrations / Duffel Webhooks")
@Controller("integrations/duffel/webhooks")
export class DuffelWebhooksController {
  private readonly logger = new Logger(DuffelWebhooksController.name);

  constructor(private readonly duffelWebhooksService: DuffelWebhooksService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Receive Duffel Webhooks",
    description: "Endpoint to receive and asynchronously process webhook events from Duffel (Flights, Stays, Cars).",
  })
  async handleWebhook(
    @Headers("x-duffel-signature") signature: string,
    @Body() payload: any,
    @Req() req: Request,
  ) {
    this.logger.log("Incoming webhook request from Duffel");
    
    // Attempt to get the raw body if configured in NestJS, otherwise stringify the JSON payload
    // Note: Stringifying a parsed JSON object may change key order/whitespace and cause signature validation to fail.
    // It's highly recommended to enable rawBody parsing in main.ts if signature validation fails.
    const rawBody = (req as any).rawBody ? (req as any).rawBody.toString() : JSON.stringify(payload);

    return this.duffelWebhooksService.handleIncomingWebhook(
      signature || "",
      payload,
      rawBody
    );
  }
}
