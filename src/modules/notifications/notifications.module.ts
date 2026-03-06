// src/modules/notifications/notifications.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import {
  Notification,
  NotificationSchema,
} from "./schemas/notification.schema";
import {
  EmailTemplate,
  EmailTemplateSchema,
} from "./schemas/email-template.schema";
import { ResendService } from "./resend.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, ResendService],
  exports: [NotificationsService, ResendService],
})
export class NotificationsModule {}
