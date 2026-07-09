// src/modules/packages/packages.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Package, PackageDocument } from "./schemas/package.schema";
import { FlightsIntegrationService } from "../integrations/flights-integration.service";
import { StaysIntegrationService } from "../integrations/stays-integration.service";

@Injectable()
export class PackagesService {
  constructor(
    @InjectModel(Package.name) private packageModel: Model<PackageDocument>,
    private flightsIntegration: FlightsIntegrationService,
    private staysIntegration: StaysIntegrationService,
  ) {}

  async create(createPackageDto: any): Promise<PackageDocument> {
    // Calculate total price based on inputs (simplified logic)
    const discountFactor = 1 - (createPackageDto.discountPercentage || 0) / 100;
    const totalPrice = createPackageDto.basePrice * discountFactor;

    const newPackage = new this.packageModel({
      ...createPackageDto,
      totalPrice,
    });
    return newPackage.save();
  }

  async findAll(query: any): Promise<PackageDocument[]> {
    const filter: any = { isActive: true };

    // Date validity check
    const now = new Date();
    filter.validFrom = { $lte: now };
    filter.validUntil = { $gte: now };

    if (query.maxPrice) {
      filter.totalPrice = { $lte: query.maxPrice };
    }

    if (query.packageType) {
      filter.packageType = query.packageType;
    }

    return this.packageModel
      .find(filter)
      .populate("flight")
      .populate("stay")
      .populate("car")
      .sort({ totalPrice: 1 })
      .exec();
  }

  async searchDynamic(query: any): Promise<any[]> {
    const origin = query.origin || "JFK"; // Default or requires input
    const destination = query.destination || "DXB";
    const departureDate = query.departureDate || new Date().toISOString().split('T')[0];
    const duration = parseInt(query.duration) || 5;
    
    // Calculate return date
    const depDateObj = new Date(departureDate);
    depDateObj.setDate(depDateObj.getDate() + duration);
    const returnDate = depDateObj.toISOString().split('T')[0];

    const flightsQuery = {
      origin,
      destination,
      departureDate,
      returnDate,
      adults: query.adults ? parseInt(query.adults) : 2,
      class: "economy"
    };

    const staysQuery = {
      location: { latitude: 0, longitude: 0, radius: 50 }, // Fallback, normally Stays needs coords or city code
      checkInDate: departureDate,
      checkOutDate: returnDate,
      rooms: 1,
      guests: Array(query.adults ? parseInt(query.adults) : 2).fill({ type: 'adult' })
    };

    // Note: StaysIntegration might need actual city code/lat-long, but we'll pass destination as string to see if adapter handles it
    (staysQuery as any).destination = destination;

    const [flightsRes, staysRes] = await Promise.all([
      this.flightsIntegration.search(flightsQuery).catch(() => ({ results: [] })),
      this.staysIntegration.search(staysQuery).catch(() => ({ results: [] }))
    ]);

    const flights = flightsRes.results || [];
    const stays = staysRes.results || [];

    const dynamicPackages: any[] = [];
    
    // Generate up to 10 combinations
    const limit = Math.min(flights.length, stays.length, 10);
    
    for (let i = 0; i < limit; i++) {
      const flight = flights[i];
      const stay = stays[i];
      
      const fPrice = flight.priceWithCommission || flight.price || 0;
      const sPrice = stay.priceWithCommission || stay.cheapestPrice || 0;
      const basePrice = Number(fPrice) + Number(sPrice);
      const discountPercentage = 15; // Dynamic packages get 15% off
      const totalPrice = basePrice * (1 - discountPercentage / 100);
      
      dynamicPackages.push({
        _id: `dyn_${flight.offerId}_${stay.accommodationId}`,
        name: `${stay.name} + Flights`,
        description: `Enjoy a dynamic package combining ${stay.name} and flights with ${flight.airline}.`,
        destination: destination,
        duration: duration,
        stars: stay.rating || 4,
        images: stay.photos?.length ? stay.photos : ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800"],
        inclusions: ["Roundtrip Flights", "Hotel Stay", "Dynamic Discount"],
        isFeatured: false,
        packageType: "hotel+flight",
        basePrice,
        discountPercentage,
        totalPrice,
        flightDetails: flight,
        stayDetails: stay
      });
    }

    // Apply pagination
    const page = parseInt(query.page) || 1;
    const limitPerPage = parseInt(query.limit) || 10;
    const startIndex = (page - 1) * limitPerPage;
    const paginatedDynamic = dynamicPackages.slice(startIndex, startIndex + limitPerPage);

    return paginatedDynamic;
  }

  async findById(id: string): Promise<PackageDocument> {
    const pkg = await this.packageModel
      .findById(id)
      .populate("flight")
      .populate("stay")
      .populate("car")
      .exec();

    if (!pkg) throw new NotFoundException("Package not found");
    return pkg as unknown as PackageDocument;
  }

  async update(id: string, data: any): Promise<PackageDocument> {
    const updated = await this.packageModel
        .findByIdAndUpdate(id, { $set: data }, { new: true })
        .exec();
    if (!updated) throw new NotFoundException('Package not found');
    return updated as unknown as PackageDocument;
  }

  async findFeatured(): Promise<PackageDocument[]> {
    return this.packageModel
      .find({ isActive: true, isFeatured: true })
      .populate("flight")
      .populate("stay")
      .populate("car")
      .limit(6)
      .exec();
  }
}
