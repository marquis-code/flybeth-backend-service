import { TrackingService } from './tracking.service';
import { Request } from 'express';
export declare class TrackingController {
    private readonly trackingService;
    constructor(trackingService: TrackingService);
    trackEvent(body: any, req: Request): Promise<import("mongoose").Document<unknown, {}, import("./schemas/tracking-event.schema").TrackingEventDocument, {}, {}> & import("./schemas/tracking-event.schema").TrackingEvent & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    flightStatusWebhook(body: any): Promise<import("mongoose").Document<unknown, {}, import("./schemas/tracking-event.schema").TrackingEventDocument, {}, {}> & import("./schemas/tracking-event.schema").TrackingEvent & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getMyHistory(req: any): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/tracking-event.schema").TrackingEventDocument, {}, {}> & import("./schemas/tracking-event.schema").TrackingEvent & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getFlightHistory(pnr: string): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/tracking-event.schema").TrackingEventDocument, {}, {}> & import("./schemas/tracking-event.schema").TrackingEvent & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
}
