// src/modules/notifications/schemas/notification.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationType, NotificationChannel } from '../../../common/constants/roles.constant';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Tenant', default: null })
    tenant: Types.ObjectId;

    @Prop({ enum: NotificationType, required: true })
    type: NotificationType;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    message: string;

    @Prop({ type: Object })
    data: Record<string, any>;

    @Prop({ enum: NotificationChannel, default: NotificationChannel.IN_APP })
    channel: NotificationChannel;

    @Prop({ default: false })
    isRead: boolean;

    @Prop()
    readAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ tenant: 1, type: 1 });
NotificationSchema.index({ createdAt: -1 });
