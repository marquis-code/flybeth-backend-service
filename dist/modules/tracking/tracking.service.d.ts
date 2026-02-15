import { Model } from 'mongoose';
import { TrackingEvent, TrackingEventDocument } from './schemas/tracking-event.schema';
export declare class TrackingService {
    private eventModel;
    private readonly logger;
    constructor(eventModel: Model<TrackingEventDocument>);
    logUserJourney(userId: string | null, event: string, metadata?: any, ip?: string, agent?: string): Promise<import("mongoose").Document<unknown, {}, TrackingEventDocument, {}, {}> & TrackingEvent & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    logFlightStatus(pnr: string, status: string, details: any): Promise<import("mongoose").Document<unknown, {}, TrackingEventDocument, {}, {}> & TrackingEvent & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getUserHistory(userId: string): Promise<(import("mongoose").Document<unknown, {}, TrackingEventDocument, {}, {}> & TrackingEvent & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getFlightHistory(pnr: string): Promise<(import("mongoose").Document<unknown, {}, TrackingEventDocument, {}, {}> & TrackingEvent & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
}
