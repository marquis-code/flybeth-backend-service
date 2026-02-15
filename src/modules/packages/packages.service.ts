// src/modules/packages/packages.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Package, PackageDocument } from './schemas/package.schema';

@Injectable()
export class PackagesService {
    constructor(
        @InjectModel(Package.name) private packageModel: Model<PackageDocument>,
    ) { }

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
            .populate('flight')
            .populate('stay')
            .populate('car')
            .sort({ totalPrice: 1 })
            .exec();
    }

    async findById(id: string): Promise<PackageDocument> {
        const pkg = await this.packageModel
            .findById(id)
            .populate('flight')
            .populate('stay')
            .populate('car')
            .exec();

        if (!pkg) throw new NotFoundException('Package not found');
        return pkg as unknown as PackageDocument;
    }
}
