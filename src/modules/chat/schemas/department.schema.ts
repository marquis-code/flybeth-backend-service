import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type DepartmentDocument = Department & Document;

@Schema({ timestamps: true, collection: "departments" })
export class Department {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: "" })
  description: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: "User" }], default: [] })
  members: Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

DepartmentSchema.index({ slug: 1 }, { unique: true });
DepartmentSchema.index({ isActive: 1 });
