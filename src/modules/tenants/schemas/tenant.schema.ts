// src/modules/tenants/schemas/tenant.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TenantStatus } from '../../../common/constants/roles.constant';

export type TenantDocument = Tenant & Document;

@Schema({ timestamps: true })
export class TenantSettings {
    @Prop({ default: 'USD' })
    defaultCurrency: string;

    @Prop({ type: [String], default: ['USD'] })
    supportedCurrencies: string[];

    @Prop({ default: 0, min: 0, max: 100 })
    markupPercentage: number;

    @Prop({ default: 0, min: 0, max: 100 })
    commissionPercentage: number;

    @Prop({ default: true })
    allowB2C: boolean;

    @Prop({ default: true })
    allowB2B: boolean;
}

@Schema({ timestamps: true })
export class TenantSubscription {
    @Prop({ enum: ['basic', 'professional', 'enterprise'], default: 'basic' })
    plan: string;

    @Prop()
    startDate: Date;

    @Prop()
    endDate: Date;

    @Prop({ enum: ['active', 'expired', 'cancelled'], default: 'active' })
    status: string;
}

@Schema({ timestamps: true, collection: 'tenants' })
export class Tenant {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    slug: string;

    @Prop({ unique: true, sparse: true, lowercase: true })
    domain: string;

    @Prop()
    logo: string;

    @Prop({ required: true })
    contactEmail: string;

    @Prop()
    contactPhone: string;

    @Prop()
    address: string;

    @Prop()
    description: string;

    @Prop({ type: TenantSettings, default: () => ({}) })
    settings: TenantSettings;

    @Prop({ type: TenantSubscription, default: () => ({}) })
    subscription: TenantSubscription;

    @Prop({ enum: TenantStatus, default: TenantStatus.PENDING })
    status: TenantStatus;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy: Types.ObjectId;

    @Prop({ default: 0 })
    totalAgents: number;

    @Prop({ default: 0 })
    totalBookings: number;

    @Prop({ default: 0 })
    totalRevenue: number;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);

// Indexes for performance
TenantSchema.index({ slug: 1 }, { unique: true });
TenantSchema.index({ status: 1 });
TenantSchema.index({ domain: 1 }, { unique: true, sparse: true });
TenantSchema.index({ createdAt: -1 });
TenantSchema.index({ name: 'text', slug: 'text', domain: 'text' });
