import { Module } from "@nestjs/common";
import { FraudService } from "./fraud.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Booking, BookingSchema } from "../bookings/schemas/booking.schema";
import { User, UserSchema } from "../users/schemas/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [FraudService],
  exports: [FraudService],
})
export class FraudModule {}
