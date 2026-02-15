// src/modules/tracking/tracking.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TrackingEvent, TrackingEventDocument } from './schemas/tracking-event.schema';

@Injectable()
export class TrackingService {
    private readonly logger = new Logger(TrackingService.name);

    constructor(
        @InjectModel(TrackingEvent.name) private eventModel: Model<TrackingEventDocument>,
    ) { }

    async logUserJourney(
        userId: string | null,
        event: string,
        metadata: any = {},
        ip?: string,
        agent?: string,
    ) {
        const log = new this.eventModel({
            type: 'user_journey',
            entityId: userId || 'anonymous',
            user: userId,
            event,
            metadata,
            ipAddress: ip,
            userAgent: agent,
        });
        return log.save();
    }

    async logFlightStatus(pnr: string, status: string, details: any) {
        this.logger.log(`Flight status update for PNR ${pnr}: ${status}`);
        const log = new this.eventModel({
            type: 'flight_status',
            entityId: pnr,
            event: status,
            metadata: details,
        });
        return log.save();
    }

    async getUserHistory(userId: string) {
        return this.eventModel
            .find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(100)
            .exec();
    }

    async getFlightHistory(pnr: string) {
        return this.eventModel
            .find({ type: 'flight_status', entityId: pnr })
            .sort({ createdAt: -1 })
            .exec();
    }
}
