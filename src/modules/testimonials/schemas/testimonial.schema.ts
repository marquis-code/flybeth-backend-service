import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TestimonialDocument = Testimonial & Document;

@Schema({ timestamps: true, collection: 'testimonials' })
export class Testimonial {
  @Prop({ required: true, trim: true })
  authorName: string;

  @Prop({ default: '', trim: true })
  authorLocation: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  body: string;

  /** Optional route the reviewer travelled, e.g. "LOS – LHR". */
  @Prop({ default: '', trim: true })
  route: string;

  @Prop({ type: Date, default: null })
  travelledAt: Date | null;

  /** Only approved testimonials are ever served publicly. */
  @Prop({ default: false })
  approved: boolean;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  /** Optional link to the booking that produced this review, for verifiability. */
  @Prop({ default: '', trim: true })
  bookingReference: string;
}

export const TestimonialSchema = SchemaFactory.createForClass(Testimonial);
TestimonialSchema.index({ approved: 1, featured: 1, sortOrder: 1 });
