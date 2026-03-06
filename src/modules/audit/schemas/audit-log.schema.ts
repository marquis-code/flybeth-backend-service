// src/modules/audit/schemas/audit-log.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true, collection: "audit_logs" })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  method: string;

  @Prop({ required: true })
  url: string;

  @Prop({ type: Object })
  body: any;

  @Prop({ type: Object })
  query: any;

  @Prop()
  ip: string;

  @Prop()
  statusCode: number;

  @Prop()
  duration: number;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ method: 1, url: 1 });
