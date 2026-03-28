import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Role, Permission } from "../../../common/constants/roles.constant";

export type InvitationDocument = Invitation & Document;

@Schema({ timestamps: true })
export class Invitation {
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ enum: Role, required: true })
  role: Role;

  @Prop({ type: [String], enum: Permission, default: [] })
  permissions: Permission[];

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ enum: ["pending", "accepted", "expired"], default: "pending" })
  status: string;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  invitedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Tenant" })
  tenant: Types.ObjectId;
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);
InvitationSchema.index({ token: 1 });
InvitationSchema.index({ email: 1 });
InvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-expire documents
