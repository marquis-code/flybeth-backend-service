import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoleDocument = RoleEntity & Document;

@Schema({ timestamps: true })
export class RoleEntity {
  @Prop({ required: true, unique: true })
  name: string; // e.g. "Support Operations"

  @Prop()
  description: string;

  @Prop({ type: [{ type: String }] }) // We've stored keys for better searchability/linking
  permissions: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDefault: boolean; // System roles that cannot be deleted
}

export const RoleSchema = SchemaFactory.createForClass(RoleEntity);
