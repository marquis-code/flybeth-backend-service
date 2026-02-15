import { Document, Types } from 'mongoose';
export type TrackingEventDocument = TrackingEvent & Document;
export declare class TrackingEvent {
    type: string;
    entityId: string;
    event: string;
    metadata: Record<string, any>;
    user?: Types.ObjectId;
    ipAddress?: string;
    userAgent?: string;
}
export declare const TrackingEventSchema: import("mongoose").Schema<TrackingEvent, import("mongoose").Model<TrackingEvent, any, any, any, Document<unknown, any, TrackingEvent, any, {}> & TrackingEvent & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TrackingEvent, Document<unknown, {}, import("mongoose").FlatRecord<TrackingEvent>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<TrackingEvent> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
