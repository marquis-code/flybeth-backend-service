import { Controller, Get, Param, Query, Post, Body } from "@nestjs/common";
import { DuffelProvider } from "./providers/duffel.provider";
import { Public } from "../../common/decorators/public.decorator";

@Controller("integrations/duffel")
export class DuffelUtilitiesController {
  constructor(private readonly duffelProvider: DuffelProvider) {}

  @Public()
  @Get("airlines")
  async getAirlines(@Query() query: any) {
    return this.duffelProvider.getAirlines(query);
  }

  @Public()
  @Get("airlines/:id")
  async getAirline(@Param("id") id: string) {
    return this.duffelProvider.getAirline(id);
  }

  @Public()
  @Get("aircraft")
  async getAircraftList(@Query() query: any) {
    return this.duffelProvider.getAircraftList(query);
  }

  @Public()
  @Get("aircraft/:id")
  async getAircraft(@Param("id") id: string) {
    return this.duffelProvider.getAircraft(id);
  }

  @Public()
  @Get("airports")
  async getAirports(@Query() query: any) {
    return this.duffelProvider.getAirports(query);
  }

  @Public()
  @Get("airports/:id")
  async getAirport(@Param("id") id: string) {
    return this.duffelProvider.getAirport(id);
  }

  @Public()
  @Get("cities")
  async getCities(@Query() query: any) {
    return this.duffelProvider.getCities(query);
  }

  @Public()
  @Get("cities/:id")
  async getCity(@Param("id") id: string) {
    return this.duffelProvider.getCity(id);
  }

  @Public()
  @Get("places/suggestions")
  async getPlacesSuggestions(@Query() query: any) {
    return this.duffelProvider.getPlacesSuggestions(query);
  }

  @Public()
  @Post("payments/payment-intents")
  async createPaymentIntent(@Body() body: { amount: string; currency: string }) {
    return this.duffelProvider.createPaymentIntent(body.amount, body.currency);
  }

  @Public()
  @Post("payments/payment-intents/:id/actions/confirm")
  async confirmPaymentIntent(@Param("id") id: string) {
    return this.duffelProvider.confirmPaymentIntent(id);
  }
}
