import { Document, Types } from 'mongoose';
import { TenantStatus } from '../../../common/constants/roles.constant';
export type TenantDocument = Tenant & Document;
export declare class TenantSettings {
    defaultCurrency: string;
    supportedCurrencies: string[];
    markupPercentage: number;
    commissionPercentage: number;
    allowB2C: boolean;
    allowB2B: boolean;
}
export declare class TenantSubscription {
    plan: string;
    startDate: Date;
    endDate: Date;
    status: string;
}
export declare class Tenant {
    name: string;
    slug: string;
    domain: string;
    logo: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    description: string;
    settings: TenantSettings;
    subscription: TenantSubscription;
    status: TenantStatus;
    createdBy: Types.ObjectId;
    totalAgents: number;
    totalBookings: number;
    totalRevenue: number;
}
export declare const TenantSchema: import("mongoose").Schema<Tenant, import("mongoose").Model<Tenant, any, any, any, Document<unknown, any, Tenant, any, {}> & Tenant & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Tenant, Document<unknown, {}, import("mongoose").FlatRecord<Tenant>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Tenant> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
