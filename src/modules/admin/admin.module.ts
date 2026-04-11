// src/modules/admin/admin.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { Booking, BookingSchema } from "../bookings/schemas/booking.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import { Tenant, TenantSchema } from "../tenants/schemas/tenant.schema";
import { Payment, PaymentSchema } from "../payments/schemas/payment.schema";
import { TenantsModule } from "../tenants/tenants.module";
import { UsersModule } from "../users/users.module";
import { BookingsModule } from "../bookings/bookings.module";
import { InvitationModule } from "./invitation.module";
import { Invitation, InvitationSchema } from "./schemas/invitation.schema";
import { NotificationsModule } from "../notifications/notifications.module";
import { FlightsModule } from "../flights/flights.module";
import { CampaignsModule } from "../campaigns/campaigns.module";
import { SchedulerModule } from "../scheduler/scheduler.module";
import { Campaign, CampaignSchema } from "../campaigns/schemas/campaign.schema";
import {
  Commission,
  CommissionSchema,
} from "../flights/schemas/commission.schema";
import { UploadModule } from "../upload/upload.module";
import { SeedModule } from "../seed/seed.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: User.name, schema: UserSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Invitation.name, schema: InvitationSchema },
      { name: Campaign.name, schema: CampaignSchema },
      { name: Commission.name, schema: CommissionSchema },
    ]),
    TenantsModule,
    UsersModule,
    BookingsModule,
    NotificationsModule,
    FlightsModule,
    CampaignsModule,
    SchedulerModule,
    UploadModule,
    SeedModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
