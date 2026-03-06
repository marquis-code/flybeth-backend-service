// src/modules/stays/stays.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { StaysController } from "./stays.controller";
import { StaysService } from "./stays.service";
import { Stay, StaySchema } from "./schemas/stay.schema";
import { Room, RoomSchema } from "./schemas/room.schema";
import { IntegrationsModule } from "../integrations/integrations.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Stay.name, schema: StaySchema },
      { name: Room.name, schema: RoomSchema },
    ]),
    IntegrationsModule,
  ],
  controllers: [StaysController],
  providers: [StaysService],
  exports: [StaysService],
})
export class StaysModule {}
