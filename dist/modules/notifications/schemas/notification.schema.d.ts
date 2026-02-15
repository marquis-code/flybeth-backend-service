import { Document, Types } from 'mongoose';
import { NotificationType, NotificationChannel } from '../../../common/constants/roles.constant';
export type NotificationDocument = Notification & Document;
export declare class Notification {
    user: Types.ObjectId;
    tenant: Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    data: Record<string, any>;
    channel: NotificationChannel;
    isRead: boolean;
    readAt: Date;
}
export declare const NotificationSchema: import("mongoose").Schema<Notification, import("mongoose").Model<Notification, any, any, any, Document<unknown, any, Notification, any, {}> & Notification & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Notification, Document<unknown, {}, import("mongoose").FlatRecord<Notification>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Notification> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
