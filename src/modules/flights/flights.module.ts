// src/modules/flights/flights.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FlightsController } from "./flights.controller";
import { FlightsService } from "./flights.service";
import { CommissionsService } from "./commissions.service";
import { Flight, FlightSchema } from "./schemas/flight.schema";
import { Commission, CommissionSchema } from "./schemas/commission.schema";
import { IntegrationsModule } from "../integrations/integrations.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Flight.name, schema: FlightSchema },
      { name: Commission.name, schema: CommissionSchema },
    ]),
    IntegrationsModule,
  ],
  controllers: [FlightsController],
  providers: [FlightsService, CommissionsService],
  exports: [FlightsService, CommissionsService],
})
export class FlightsModule {}
