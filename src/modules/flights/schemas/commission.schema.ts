import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types, Schema as MongooseSchema } from "mongoose";

export type CommissionDocument = Commission & Document;

@Schema({ timestamps: true })
export class Commission {
  @Prop({ required: true, uppercase: true })
  airlineCode: string;

  @Prop({ required: true, enum: ["fixed", "percentage"], default: "fixed" })
  type: string;

  @Prop({ required: true, default: 0 })
  b2bValue: number;

  @Prop({ required: true, default: 0 })
  b2cValue: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Tenant", default: null })
  tenant: Types.ObjectId;
}

export const CommissionSchema = SchemaFactory.createForClass(Commission);
CommissionSchema.index({ airlineCode: 1, tenant: 1 });
