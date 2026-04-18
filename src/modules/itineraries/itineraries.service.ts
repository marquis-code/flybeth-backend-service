import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Itinerary, ItineraryDocument } from './schemas/itinerary.schema';

@Injectable()
export class ItinerariesService {
  constructor(
    @InjectModel(Itinerary.name) private itineraryModel: Model<ItineraryDocument>,
  ) {}

  async create(tenantId: string, agentId: string, data: any): Promise<ItineraryDocument> {
    const itinerary = new this.itineraryModel({
      ...data,
      tenant: new Types.ObjectId(tenantId),
      agent: new Types.ObjectId(agentId),
      shareSlug: `trip-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    });
    return itinerary.save();
  }

  async findAll(tenantId: string): Promise<ItineraryDocument[]> {
    return this.itineraryModel.find({ tenant: new Types.ObjectId(tenantId) }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<ItineraryDocument> {
    const itinerary = await this.itineraryModel.findById(id).exec();
    if (!itinerary) throw new NotFoundException('Itinerary not found');
    return itinerary;
  }

  async update(id: string, data: any): Promise<ItineraryDocument> {
    const updated = await this.itineraryModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Itinerary not found');
    return updated;
  }
}
