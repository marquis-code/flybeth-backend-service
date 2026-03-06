// src/modules/seed/seed.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SeedService } from "./seed.service";
import {
  Airport,
  AirportSchema,
  Airline,
  AirlineSchema,
} from "../airports/schemas/airport.schema";
import {
  BankAccount,
  BankAccountSchema,
} from "../payments/schemas/bank-account.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Airport.name, schema: AirportSchema },
      { name: Airline.name, schema: AirlineSchema },
      { name: BankAccount.name, schema: BankAccountSchema },
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
