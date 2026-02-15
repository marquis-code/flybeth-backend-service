// src/modules/tracking/schemas/tracking-event.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TrackingEventDocument = TrackingEvent & Document;

@Schema({ timestamps: true })
export class TrackingEvent {
    @Prop({ required: true, enum: ['flight_status', 'user_journey'] })
    type: string;

    // Could be UserId or BookingReference
    @Prop({ index: true })
    entityId: string;

    @Prop({ required: true })
    event: string; // e.g. 'search', 'booking_started', 'flight_delayed'

    @Prop({ type: Object })
    metadata: Record<string, any>;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    user?: Types.ObjectId;

    @Prop()
    ipAddress?: string;

    @Prop()
    userAgent?: string;
}

export const TrackingEventSchema = SchemaFactory.createForClass(TrackingEvent);
TrackingEventSchema.index({ type: 1, entityId: 1, createdAt: -1 });
