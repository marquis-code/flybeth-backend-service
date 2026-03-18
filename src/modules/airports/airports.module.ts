// src/modules/airports/airports.module.ts
import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AirportsController } from "./airports.controller";
import { AirportsService } from "./airports.service";
import { IntegrationsModule } from "../integrations/integrations.module";
import {
  Airport,
  AirportSchema,
  Airline,
  AirlineSchema,
} from "./schemas/airport.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Airport.name, schema: AirportSchema },
      { name: Airline.name, schema: AirlineSchema },
    ]),
    forwardRef(() => IntegrationsModule),
  ],
  controllers: [AirportsController],
  providers: [AirportsService],
  exports: [AirportsService],
})
export class AirportsModule { }
