import { Document, Types } from 'mongoose';
export type PackageDocument = Package & Document;
export declare class Package {
    name: string;
    description: string;
    images: string[];
    flight: Types.ObjectId;
    stay: Types.ObjectId;
    car: Types.ObjectId;
    packageType: string;
    basePrice: number;
    discountPercentage: number;
    totalPrice: number;
    isActive: boolean;
    validFrom: Date;
    validUntil: Date;
}
export declare const PackageSchema: import("mongoose").Schema<Package, import("mongoose").Model<Package, any, any, any, Document<unknown, any, Package, any, {}> & Package & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Package, Document<unknown, {}, import("mongoose").FlatRecord<Package>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Package> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
