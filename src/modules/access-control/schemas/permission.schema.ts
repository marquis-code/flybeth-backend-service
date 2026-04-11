import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = PermissionEntity & Document;

@Schema({ timestamps: true })
export class PermissionEntity {
  @Prop({ required: true, unique: true })
  name: string; // User-facing name: e.g. "View Revenue"

  @Prop({ required: true, unique: true })
  key: string; // Technical key: e.g. "view_revenue"

  @Prop()
  description: string;

  @Prop({ default: 'general' })
  category: string; // For UI grouping: dashboard, agency, booking, finance, etc.
}

export const PermissionSchema = SchemaFactory.createForClass(PermissionEntity);
