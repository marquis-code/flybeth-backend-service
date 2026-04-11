import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Invitation, InvitationSchema } from "./schemas/invitation.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invitation.name, schema: InvitationSchema },
    ]),
  ],
  providers: [],
  exports: [MongooseModule],
})
export class InvitationModule {}
