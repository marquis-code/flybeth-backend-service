// src/modules/flights/flights.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FlightsController } from "./flights.controller";
import { FlightsService } from "./flights.service";
import { CommissionsService } from "./commissions.service";
import { Flight, FlightSchema } from "./schemas/flight.schema";
import { Commission, CommissionSchema } from "./schemas/commission.schema";
import { SearchSession, SearchSessionSchema } from "./schemas/search-session.schema";
import { RecentSearch, RecentSearchSchema } from "./schemas/recent-search.schema";
import { IntegrationsModule } from "../integrations/integrations.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Flight.name, schema: FlightSchema },
      { name: Commission.name, schema: CommissionSchema },
      { name: SearchSession.name, schema: SearchSessionSchema },
      { name: RecentSearch.name, schema: RecentSearchSchema },
    ]),
    IntegrationsModule,
  ],
  controllers: [FlightsController],
  providers: [FlightsService, CommissionsService],
  exports: [FlightsService, CommissionsService],
})
export class FlightsModule {}
