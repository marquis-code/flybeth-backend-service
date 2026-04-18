import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';

@Injectable()
export class FinanceService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
  ) {}

  async createInvoice(tenantId: string, userId: string, data: any): Promise<InvoiceDocument> {
    const invoice = new this.invoiceModel({
      ...data,
      tenant: new Types.ObjectId(tenantId),
      issuedBy: new Types.ObjectId(userId),
      invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    });
    return invoice.save();
  }

  async findAll(tenantId: string): Promise<InvoiceDocument[]> {
    return this.invoiceModel.find({ tenant: new Types.ObjectId(tenantId) })
      .populate('booking')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getStats(tenantId: string) {
    const invoices = await this.invoiceModel.find({ tenant: new Types.ObjectId(tenantId) }).exec();
    
    const unpaid = invoices.filter(i => i.status === 'unpaid').reduce((sum, i) => sum + i.amount, 0);
    const paid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
    const overdue = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);

    return {
      unpaidReceivables: unpaid,
      clearedPayouts: paid,
      overdueSettlements: overdue,
      totalVolume: unpaid + paid + overdue,
      grossCommission: Math.round((paid + unpaid) * 0.1) // 10% demo commission
    };
  }
}
