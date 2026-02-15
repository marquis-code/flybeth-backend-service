// src/modules/passengers/passengers.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassengersController } from './passengers.controller';
import { PassengersService } from './passengers.service';
import { Passenger, PassengerSchema } from './schemas/passenger.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Passenger.name, schema: PassengerSchema }]),
    ],
    controllers: [PassengersController],
    providers: [PassengersService],
    exports: [PassengersService],
})
export class PassengersModule { }
