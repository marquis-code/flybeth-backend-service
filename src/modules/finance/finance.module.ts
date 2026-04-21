import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { WalletService } from './wallet.service';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService, WalletService],
  exports: [FinanceService, WalletService],
})
export class FinanceModule {}
