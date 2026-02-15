"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackagesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const package_schema_1 = require("./schemas/package.schema");
let PackagesService = class PackagesService {
    constructor(packageModel) {
        this.packageModel = packageModel;
    }
    async create(createPackageDto) {
        const discountFactor = 1 - (createPackageDto.discountPercentage || 0) / 100;
        const totalPrice = createPackageDto.basePrice * discountFactor;
        const newPackage = new this.packageModel({
            ...createPackageDto,
            totalPrice,
        });
        return newPackage.save();
    }
    async findAll(query) {
        const filter = { isActive: true };
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
    async findById(id) {
        const pkg = await this.packageModel
            .findById(id)
            .populate('flight')
            .populate('stay')
            .populate('car')
            .exec();
        if (!pkg)
            throw new common_1.NotFoundException('Package not found');
        return pkg;
    }
};
exports.PackagesService = PackagesService;
exports.PackagesService = PackagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(package_schema_1.Package.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], PackagesService);
//# sourceMappingURL=packages.service.js.map