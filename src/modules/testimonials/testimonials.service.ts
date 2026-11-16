import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Testimonial, TestimonialDocument } from './schemas/testimonial.schema';

export interface FeaturedTestimonials {
  items: TestimonialDocument[];
  summary: {
    averageRating: number;
    reviewCount: number;
  };
}

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectModel(Testimonial.name)
    private readonly testimonialModel: Model<TestimonialDocument>,
  ) {}

  /**
   * Only approved + featured reviews are public. The average is computed from
   * every approved review (not just the featured ones) so the headline rating
   * is not skewed by which cards we happen to display.
   */
  async featured(limit = 4): Promise<FeaturedTestimonials> {
    const safeLimit = Math.min(Math.max(limit, 1), 12);

    const [items, aggregate] = await Promise.all([
      this.testimonialModel
        .find({ approved: true, featured: true })
        .sort({ sortOrder: 1, createdAt: -1 })
        .limit(safeLimit)
        .lean()
        .exec(),
      this.testimonialModel
        .aggregate<{ _id: null; averageRating: number; reviewCount: number }>([
          { $match: { approved: true } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              reviewCount: { $sum: 1 },
            },
          },
        ])
        .exec(),
    ]);

    return {
      items: items as unknown as TestimonialDocument[],
      summary: {
        averageRating: Math.round(((aggregate[0]?.averageRating ?? 0) * 10)) / 10,
        reviewCount: aggregate[0]?.reviewCount ?? 0,
      },
    };
  }

  async create(payload: Partial<Testimonial>): Promise<TestimonialDocument> {
    return this.testimonialModel.create(payload);
  }

  async list(): Promise<TestimonialDocument[]> {
    return this.testimonialModel
      .find()
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
      .exec() as unknown as TestimonialDocument[];
  }

  async update(id: string, payload: Partial<Testimonial>): Promise<TestimonialDocument> {
    const updated = await this.testimonialModel
      .findByIdAndUpdate(id, { $set: payload }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Testimonial not found');
    return updated;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const deleted = await this.testimonialModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Testimonial not found');
    return { success: true };
  }
}
