// src/modules/finance/wallet.service.ts
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Transaction, TransactionDocument, TransactionType, TransactionStatus } from './schemas/transaction.schema';
import { generateReference } from '../../common/utils/crypto.util';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    return user.walletBalance || 0;
  }

  async setWalletPin(userId: string, hashedPin: string) {
    await this.userModel.findByIdAndUpdate(userId, { walletPin: hashedPin });
  }

  async verifyPin(userId: string, pin: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).select('+walletPin').exec();
    if (!user || !user.walletPin) return false;
    // For now simple comparison, in production use bcrypt
    return user.walletPin === pin;
  }

  async debit(userId: string, amount: number, description: string, bookingId?: string): Promise<TransactionDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    if (user.walletBalance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const session = await this.userModel.db.startSession();
    session.startTransaction();

    try {
      // 1. Update user balance
      await this.userModel.findByIdAndUpdate(
        userId,
        { $inc: { walletBalance: -amount } },
        { session }
      );

      // 2. Create transaction record
      const transaction = new this.transactionModel({
        user: new Types.ObjectId(userId),
        tenant: user.tenant,
        amount,
        type: TransactionType.DEBIT,
        status: TransactionStatus.SUCCESS,
        reference: `WLT-DBT-${generateReference()}`,
        description,
        booking: bookingId ? new Types.ObjectId(bookingId) : null,
      });

      await transaction.save({ session });
      await session.commitTransaction();
      
      this.logger.log(`Wallet debited: ${userId} - ${amount}`);
      return transaction;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Wallet debit failed: ${error.message}`);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async credit(userId: string, amount: number, description: string, metadata?: any): Promise<TransactionDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    const session = await this.userModel.db.startSession();
    session.startTransaction();

    try {
      await this.userModel.findByIdAndUpdate(
        userId,
        { $inc: { walletBalance: amount } },
        { session }
      );

      const transaction = new this.transactionModel({
        user: new Types.ObjectId(userId),
        tenant: user.tenant,
        amount,
        type: TransactionType.CREDIT,
        status: TransactionStatus.SUCCESS,
        reference: `WLT-CRD-${generateReference()}`,
        description,
        metadata,
      });

      await transaction.save({ session });
      await session.commitTransaction();

      this.logger.log(`Wallet credited: ${userId} + ${amount}`);
      return transaction;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getTransactions(userId: string, limit: number = 20) {
    return this.transactionModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
