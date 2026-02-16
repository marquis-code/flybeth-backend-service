// src/modules/bookings/bookings.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { FlightsModule } from '../flights/flights.module';
import { TenantsModule } from '../tenants/tenants.module';
import { StaysModule } from '../stays/stays.module';
import { CarsModule } from '../cars/cars.module';
import { CruisesModule } from '../cruises/cruises.module';
import { PackagesModule } from '../packages/packages.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
        FlightsModule,
        TenantsModule,
        StaysModule,
        CarsModule,
        CruisesModule,
        PackagesModule,
    ],
    controllers: [BookingsController],
    providers: [BookingsService],
    exports: [BookingsService],
})
export class BookingsModule { }
