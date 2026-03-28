import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type CampaignDocument = Campaign & Document;

@Schema({ timestamps: true })
export class Campaign {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: "draft", enum: ["draft", "scheduled", "sent", "failed"] })
  status: string;

  @Prop()
  scheduledAt: Date;

  @Prop({ type: [String], default: ["customer"] })
  targetRoles: string[];

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy: Types.ObjectId;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
CampaignSchema.index({ status: 1 });
CampaignSchema.index({ scheduledAt: 1 });
