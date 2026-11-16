import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true, collection: 'coupons' })
export class Coupon {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  /** Short marketing line shown on the landing-page banner. */
  @Prop({ default: '', trim: true })
  headline: string;

  @Prop({ default: '', trim: true })
  description: string;

  @Prop({ enum: ['percentage', 'fixed'], default: 'percentage' })
  type: string;

  @Prop({ required: true, min: 0 })
  value: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ default: 0, min: 0 })
  minSpend: number;

  /** Cap for percentage coupons; null = uncapped. */
  @Prop({ type: Number, default: null })
  maxDiscount: number | null;

  @Prop({ type: Date, default: null })
  startsAt: Date | null;

  @Prop({ type: Date, default: null })
  expiresAt: Date | null;

  @Prop({ default: true })
  active: boolean;

  /** Public coupons are surfaced on the landing page; private ones are not. */
  @Prop({ default: false })
  isPublic: boolean;

  /** 0 = unlimited redemptions. */
  @Prop({ default: 0, min: 0 })
  usageLimit: number;

  @Prop({ default: 0, min: 0 })
  usedCount: number;

  @Prop({ type: [String], default: ['flights', 'stays', 'cars', 'packages'] })
  appliesTo: string[];

  @Prop({ default: '/terms' })
  termsUrl: string;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
CouponSchema.index({ active: 1, isPublic: 1, expiresAt: 1 });
