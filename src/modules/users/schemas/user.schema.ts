// src/modules/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import {
  Role,
  Permission,
  AgentStatus,
  AgentTier,
} from "../../../common/constants/roles.constant";

export type UserDocument = User & Document;

@Schema({ _id: false })
export class UserPreferences {
  @Prop({ default: "USD" })
  currency: string;

  @Prop({ default: "en" })
  language: string;

  @Prop({ default: true })
  emailNotifications: boolean;

  @Prop({ default: true })
  pushNotifications: boolean;
}

@Schema({ _id: false })
export class FrequentFlyer {
  @Prop()
  airline: string;

  @Prop()
  number: string;
}

@Schema({ _id: false })
export class AgentProfile {
  // Business Information
  @Prop()
  agencyName: string;

  @Prop()
  registrationNumber: string;

  @Prop()
  country: string;

  @Prop()
  businessAddress: string;

  @Prop()
  website: string;

  // Contact Information
  @Prop()
  whatsappNumber: string;

  // Identity Verification (KYC)
  @Prop()
  idCardUrl: string;

  @Prop({ enum: ["pending", "approved", "rejected"], default: "pending" })
  idCardStatus: string;

  @Prop()
  selfieUrl: string;

  @Prop({ enum: ["pending", "approved", "rejected"], default: "pending" })
  selfieStatus: string;

  // Business Documents
  @Prop()
  cacCertificateUrl: string; // Nigeria

  @Prop({ enum: ["pending", "approved", "rejected"], default: "pending" })
  cacCertificateStatus: string;

  @Prop()
  llcDocsUrl: string; // USA

  @Prop()
  ein: string; // USA

  @Prop()
  kycFeedback: string;

  // Payment & Billing
  @Prop({ type: Object })
  bankAccountDetails: Record<string, any>;

  @Prop()
  billingAddress: string;
}

@Schema({ timestamps: true, collection: "users" })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ trim: true })
  lastName: string;

  @Prop()
  agencyName: string;

  @Prop()
  agencyType: string;

  @Prop()
  phone: string;

  @Prop()
  avatar: string;

  @Prop({ enum: AgentTier, default: AgentTier.BASIC })
  agentTier: AgentTier;

  @Prop({ enum: AgentStatus, default: AgentStatus.PENDING })
  agentStatus: AgentStatus;

  @Prop({ type: Types.ObjectId, ref: "RoleEntity", default: null })
  role: Types.ObjectId | any;

  @Prop({ type: AgentProfile })
  agentProfile: AgentProfile;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: Types.ObjectId, ref: "Tenant", default: null })
  tenant: Types.ObjectId;

  @Prop({ type: UserPreferences, default: () => ({}) })
  preferences: UserPreferences;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  firstLogin: boolean;

  @Prop()
  lastLogin: Date;

  @Prop({ type: [FrequentFlyer], default: [] })
  frequentFlyers: FrequentFlyer[];

  @Prop({ type: [{ type: Types.ObjectId, ref: "Passenger" }], default: [] })
  savedPassengers: Types.ObjectId[];

  // OTP fields
  @Prop({ select: false })
  otp?: string;

  @Prop({ select: false })
  otpExpiry?: Date;

  // Password reset
  @Prop({ select: false })
  resetToken?: string;

  @Prop({ select: false })
  resetTokenExpiry?: Date;

  // Refresh token
  @Prop({ select: false })
  refreshToken: string;

  @Prop()
  lastIp: string;

  // Security & 2FA
  @Prop({ default: false })
  twoFactorEnabled: boolean;

  @Prop({ select: false })
  twoFactorSecret: string;

  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop({ type: Date })
  lockUntil: Date | null;

  @Prop({ type: [String], default: [] })
  lastLoginIps: string[];

  @Prop({ type: [String], default: [] })
  lastLoginDevices: string[];

  @Prop()
  duffelCustomerId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ tenant: 1, role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ firstName: "text", lastName: "text", email: "text" });
