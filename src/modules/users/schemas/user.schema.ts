// src/modules/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../../common/constants/roles.constant';

export type UserDocument = User & Document;

@Schema({ _id: false })
export class UserPreferences {
    @Prop({ default: 'USD' })
    currency: string;

    @Prop({ default: 'en' })
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

@Schema({ timestamps: true, collection: 'users' })
export class User {
    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    email: string;

    @Prop({ required: true, select: false })
    password: string;

    @Prop({ required: true, trim: true })
    firstName: string;

    @Prop({ required: true, trim: true })
    lastName: string;

    @Prop()
    phone: string;

    @Prop()
    avatar: string;

    @Prop({ enum: Role, default: Role.CUSTOMER })
    role: Role;

    @Prop({ type: Types.ObjectId, ref: 'Tenant', default: null })
    tenant: Types.ObjectId;

    @Prop({ type: UserPreferences, default: () => ({}) })
    preferences: UserPreferences;

    @Prop({ default: false })
    isVerified: boolean;

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    lastLogin: Date;

    @Prop({ type: [FrequentFlyer], default: [] })
    frequentFlyers: FrequentFlyer[];

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Passenger' }], default: [] })
    savedPassengers: Types.ObjectId[];

    // OTP fields
    @Prop({ select: false })
    otp: string;

    @Prop({ select: false })
    otpExpiry: Date;

    // Password reset
    @Prop({ select: false })
    resetToken: string;

    @Prop({ select: false })
    resetTokenExpiry: Date;

    // Refresh token
    @Prop({ select: false })
    refreshToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for performance
UserSchema.index({ tenant: 1, role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });
