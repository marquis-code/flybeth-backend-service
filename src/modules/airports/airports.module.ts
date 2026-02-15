// src/modules/airports/airports.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AirportsController } from './airports.controller';
import { AirportsService } from './airports.service';
import {
    Airport,
    AirportSchema,
    Airline,
    AirlineSchema,
} from './schemas/airport.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Airport.name, schema: AirportSchema },
            { name: Airline.name, schema: AirlineSchema },
        ]),
    ],
    controllers: [AirportsController],
    providers: [AirportsService],
    exports: [AirportsService],
})
export class AirportsModule { }
