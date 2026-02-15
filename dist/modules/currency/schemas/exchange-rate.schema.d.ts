import { Document } from 'mongoose';
export type ExchangeRateDocument = ExchangeRate & Document;
export declare class ExchangeRate {
    baseCurrency: string;
    rates: Map<string, number>;
    fetchedAt: Date;
}
export declare const ExchangeRateSchema: import("mongoose").Schema<ExchangeRate, import("mongoose").Model<ExchangeRate, any, any, any, Document<unknown, any, ExchangeRate, any, {}> & ExchangeRate & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ExchangeRate, Document<unknown, {}, import("mongoose").FlatRecord<ExchangeRate>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ExchangeRate> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
