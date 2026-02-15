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
var CarsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const car_schema_1 = require("./schemas/car.schema");
let CarsService = CarsService_1 = class CarsService {
    constructor(carModel) {
        this.carModel = carModel;
        this.logger = new common_1.Logger(CarsService_1.name);
    }
    async search(searchDto) {
        const query = {
            type: searchDto.type,
            isAvailable: true,
        };
        if (searchDto.pickUpLocation) {
            query.availableLocations = {
                $in: [new RegExp(searchDto.pickUpLocation, 'i')]
            };
        }
        if (searchDto.category) {
            query.category = searchDto.category;
        }
        if (searchDto.passengers) {
            query['capacity.passengers'] = { $gte: searchDto.passengers };
        }
        return this.carModel.find(query).exec();
    }
    async findById(id) {
        const car = await this.carModel.findById(id).exec();
        if (!car)
            throw new common_1.NotFoundException(`Car with ID ${id} not found`);
        return car;
    }
    async create(createCarDto) {
        const newCar = new this.carModel(createCarDto);
        return newCar.save();
    }
    async findAll() {
        return this.carModel.find().exec();
    }
};
exports.CarsService = CarsService;
exports.CarsService = CarsService = CarsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(car_schema_1.Car.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], CarsService);
//# sourceMappingURL=cars.service.js.map