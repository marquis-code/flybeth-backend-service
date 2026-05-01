import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type SearchSessionDocument = SearchSession & Document;

@Schema({ timestamps: true })
export class SearchSession {
  @Prop({ type: Object, required: true })
  criteria: any;

  @Prop({ default: () => new Date(Date.now() + 1000 * 60 * 60 * 24) }) // 24 hours expiry
  expiresAt: Date;
}

export const SearchSessionSchema = SchemaFactory.createForClass(SearchSession);
SearchSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL Index
