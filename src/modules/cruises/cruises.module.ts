// src/modules/cruises/cruises.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CruisesController } from './cruises.controller';
import { CruisesService } from './cruises.service';
import { Cruise, CruiseSchema } from './schemas/cruise.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Cruise.name, schema: CruiseSchema }]),
    ],
    controllers: [CruisesController],
    providers: [CruisesService],
    exports: [CruisesService],
})
export class CruisesModule { }
