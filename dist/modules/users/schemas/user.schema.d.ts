import { Document, Types } from 'mongoose';
import { Role } from '../../../common/constants/roles.constant';
export type UserDocument = User & Document;
export declare class UserPreferences {
    currency: string;
    language: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
}
export declare class FrequentFlyer {
    airline: string;
    number: string;
}
export declare class User {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatar: string;
    role: Role;
    tenant: Types.ObjectId;
    preferences: UserPreferences;
    isVerified: boolean;
    isActive: boolean;
    lastLogin: Date;
    frequentFlyers: FrequentFlyer[];
    savedPassengers: Types.ObjectId[];
    otp: string;
    otpExpiry: Date;
    resetToken: string;
    resetTokenExpiry: Date;
    refreshToken: string;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<User> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
