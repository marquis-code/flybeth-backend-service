import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon, CouponDocument } from './schemas/coupon.schema';

export interface CouponValidation {
  valid: boolean;
  reason?: string;
  code?: string;
  discount?: number;
  coupon?: {
    code: string;
    type: string;
    value: number;
    currency: string;
    description: string;
    expiresAt: Date | null;
  };
}

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(
    @InjectModel(Coupon.name) private readonly couponModel: Model<CouponDocument>,
  ) {}

  /**
   * Coupons that may be shown on the landing page: public, active, inside their
   * validity window and not exhausted. Soonest expiry first so the banner can
   * show urgency without inventing it.
   */
  async findPublicCoupons(limit = 3): Promise<CouponDocument[]> {
    const now = new Date();
    return this.couponModel
      .find({
        active: true,
        isPublic: true,
        $and: [
          { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
          { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] },
          { $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] },
        ],
      })
      .sort({ expiresAt: 1, createdAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 10))
      .lean()
      .exec() as unknown as CouponDocument[];
  }

  /** Server-side check used by checkout and the landing-page promo box. */
  async validate(code: string, amount = 0, product = 'flights'): Promise<CouponValidation> {
    const normalized = (code || '').trim().toUpperCase();
    if (!normalized) return { valid: false, reason: 'Enter a promo code' };

    const coupon = await this.couponModel.findOne({ code: normalized }).lean().exec();
    if (!coupon) return { valid: false, reason: 'That promo code is not recognised' };
    if (!coupon.active) return { valid: false, reason: 'That promo code is no longer active' };

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      return { valid: false, reason: 'That promo code is not active yet' };
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return { valid: false, reason: 'That promo code has expired' };
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, reason: 'That promo code has reached its limit' };
    }
    if (coupon.appliesTo?.length && !coupon.appliesTo.includes(product)) {
      return { valid: false, reason: `That promo code does not apply to ${product}` };
    }
    if (coupon.minSpend > 0 && amount < coupon.minSpend) {
      return {
        valid: false,
        reason: `A minimum spend of ${coupon.currency} ${coupon.minSpend} is required`,
      };
    }

    let discount =
      coupon.type === 'percentage'
        ? (amount * coupon.value) / 100
        : coupon.value;
    if (coupon.type === 'percentage' && coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
    if (coupon.type === 'percentage' && amount > 0) discount = Math.min(discount, amount);
    discount = Math.round(discount * 100) / 100;

    return {
      valid: true,
      code: coupon.code,
      discount,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        currency: coupon.currency,
        description: coupon.description,
        expiresAt: coupon.expiresAt ?? null,
      },
    };
  }

  async create(payload: Partial<Coupon>): Promise<CouponDocument> {
    const code = (payload.code || '').trim().toUpperCase();
    if (!code) throw new BadRequestException('A promo code is required');
    if (!payload.value || payload.value <= 0) {
      throw new BadRequestException('A discount value greater than zero is required');
    }
    const existing = await this.couponModel.findOne({ code }).lean().exec();
    if (existing) throw new BadRequestException(`Promo code ${code} already exists`);

    const created = await this.couponModel.create({ ...payload, code });
    this.logger.log(`Coupon created: ${created.code}`);
    return created;
  }

  async list(): Promise<CouponDocument[]> {
    return this.couponModel.find().sort({ createdAt: -1 }).limit(200).lean().exec() as unknown as CouponDocument[];
  }

  async update(id: string, payload: Partial<Coupon>): Promise<CouponDocument> {
    const updated = await this.couponModel
      .findByIdAndUpdate(id, { $set: payload }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Coupon not found');
    return updated;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const deleted = await this.couponModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Coupon not found');
    return { success: true };
  }

  /** Called when an order is paid with a coupon attached. */
  async recordRedemption(code: string): Promise<void> {
    await this.couponModel
      .updateOne({ code: (code || '').toUpperCase() }, { $inc: { usedCount: 1 } })
      .exec();
  }
}
