// src/modules/payments/payments.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { StripeProvider } from "./providers/stripe.provider";
import { PaystackProvider } from "./providers/paystack.provider";
import { Payment, PaymentSchema } from "./schemas/payment.schema";
import { BankAccount, BankAccountSchema } from "./schemas/bank-account.schema";
import { BookingsModule } from "../bookings/bookings.module";
import { FinanceModule } from "../finance/finance.module";

import { BnplFactory } from "./bnpl/bnpl.factory";
import { CredpalService } from "./bnpl/services/credpal.service";
import { AffirmService } from "./bnpl/services/affirm.service";
import { KlarnaService } from "./bnpl/services/klarna.service";
import { PaypalFourService } from "./bnpl/services/paypal-four.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: BankAccount.name, schema: BankAccountSchema },
    ]),
    BookingsModule,
    FinanceModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService, 
    StripeProvider, 
    PaystackProvider,
    BnplFactory,
    CredpalService,
    AffirmService,
    KlarnaService,
    PaypalFourService
  ],
  exports: [PaymentsService, BnplFactory],
})
export class PaymentsModule {}
