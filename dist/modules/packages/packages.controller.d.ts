import { PackagesService } from './packages.service';
export declare class PackagesController {
    private readonly packagesService;
    constructor(packagesService: PackagesService);
    create(createPackageDto: any): Promise<import("./schemas/package.schema").PackageDocument>;
    findAll(query: any): Promise<import("./schemas/package.schema").PackageDocument[]>;
    findOne(id: string): Promise<import("./schemas/package.schema").PackageDocument>;
}
