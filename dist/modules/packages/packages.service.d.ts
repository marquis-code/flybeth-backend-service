import { Model } from 'mongoose';
import { PackageDocument } from './schemas/package.schema';
export declare class PackagesService {
    private packageModel;
    constructor(packageModel: Model<PackageDocument>);
    create(createPackageDto: any): Promise<PackageDocument>;
    findAll(query: any): Promise<PackageDocument[]>;
    findById(id: string): Promise<PackageDocument>;
}
