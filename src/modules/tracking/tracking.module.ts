// src/modules/tracking/tracking.module.ts
import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ChatModule } from "../chat/chat.module";
import { TrackingController } from "./tracking.controller";
import { TrackingService } from "./tracking.service";
import {
  TrackingEvent,
  TrackingEventSchema,
} from "./schemas/tracking-event.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TrackingEvent.name, schema: TrackingEventSchema },
    ]),
    forwardRef(() => ChatModule),
  ],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
