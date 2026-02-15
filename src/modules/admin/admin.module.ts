// src/modules/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Booking.name, schema: BookingSchema },
            { name: User.name, schema: UserSchema },
            { name: Tenant.name, schema: TenantSchema },
            { name: Payment.name, schema: PaymentSchema },
        ]),
        TenantsModule,
        UsersModule,
        BookingsModule,
    ],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule { }
