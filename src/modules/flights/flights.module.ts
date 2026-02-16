// src/modules/flights/flights.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';
import { Flight, FlightSchema } from './schemas/flight.schema';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Flight.name, schema: FlightSchema }]),
        IntegrationsModule,
    ],
    controllers: [FlightsController],
    providers: [FlightsService],
    exports: [FlightsService],
})
export class FlightsModule { }
