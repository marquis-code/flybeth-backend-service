import { Module } from "@nestjs/common";
import { FraudService } from "./fraud.service";
import { FraudController } from "./fraud.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Booking, BookingSchema } from "../bookings/schemas/booking.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import { TrackingEvent, TrackingEventSchema } from "../tracking/schemas/tracking-event.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: User.name, schema: UserSchema },
      { name: TrackingEvent.name, schema: TrackingEventSchema },
    ]),
  ],
  controllers: [FraudController],
  providers: [FraudService],
  exports: [FraudService],
})
export class FraudModule {}
