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
var CruisesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CruisesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const cruise_schema_1 = require("./schemas/cruise.schema");
let CruisesService = CruisesService_1 = class CruisesService {
    constructor(cruiseModel) {
        this.cruiseModel = cruiseModel;
        this.logger = new common_1.Logger(CruisesService_1.name);
    }
    async search(searchDto) {
        const query = { isAvailable: true };
        if (searchDto.destination && searchDto.destination !== 'Any') {
            query.destination = new RegExp(searchDto.destination, 'i');
        }
        if (searchDto.cruiseLine && searchDto.cruiseLine !== 'Any') {
            query.cruiseLine = new RegExp(searchDto.cruiseLine, 'i');
        }
        if (searchDto.minNights || searchDto.maxNights) {
            query.durationNights = {};
            if (searchDto.minNights)
                query.durationNights.$gte = searchDto.minNights;
            if (searchDto.maxNights)
                query.durationNights.$lte = searchDto.maxNights;
        }
        if (searchDto.departureMonth) {
            const start = new Date(`${searchDto.departureMonth}-01`);
            const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            query.departureDate = { $gte: start, $lte: end };
        }
        return this.cruiseModel.find(query).exec();
    }
    async findById(id) {
        const cruise = await this.cruiseModel.findById(id).exec();
        if (!cruise)
            throw new common_1.NotFoundException(`Cruise with ID ${id} not found`);
        return cruise;
    }
    async create(createCruiseDto) {
        const newCruise = new this.cruiseModel(createCruiseDto);
        return newCruise.save();
    }
    async updateCabinAvailability(cruiseId, cabinType, count) {
        const cruise = await this.findById(cruiseId);
        const cabin = cruise.cabinClasses.find(c => c.type === cabinType);
        if (!cabin)
            throw new common_1.NotFoundException(`Cabin type ${cabinType} not found`);
        cabin.availability -= count;
        await cruise.save();
    }
};
exports.CruisesService = CruisesService;
exports.CruisesService = CruisesService = CruisesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(cruise_schema_1.Cruise.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], CruisesService);
//# sourceMappingURL=cruises.service.js.map