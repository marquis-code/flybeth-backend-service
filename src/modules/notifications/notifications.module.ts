// src/modules/notifications/notifications.module.ts
import { Module, Global } from "@nestjs/common";
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
import { BullModule } from "@nestjs/bull";
import { EmailProcessor } from "./email.processor";

import { forwardRef } from "@nestjs/common";
import { ChatModule } from "../chat/chat.module";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
    ]),
    BullModule.registerQueue({
      name: "email-queue",
    }),
    forwardRef(() => ChatModule),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, ResendService, EmailProcessor],
  exports: [NotificationsService, ResendService],
})
export class NotificationsModule {}
