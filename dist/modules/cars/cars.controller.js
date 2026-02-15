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
exports.CarsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cars_service_1 = require("./cars.service");
const car_dto_1 = require("./dto/car.dto");
let CarsController = class CarsController {
    constructor(carsService) {
        this.carsService = carsService;
    }
    async search(searchDto) {
        return this.carsService.search(searchDto);
    }
    async findById(id) {
        return this.carsService.findById(id);
    }
    async create(createCarDto) {
        return this.carsService.create(createCarDto);
    }
    async findAll() {
        return this.carsService.findAll();
    }
};
exports.CarsController = CarsController;
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search for rental cars or rides' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [car_dto_1.SearchCarsDto]),
    __metadata("design:returntype", Promise)
], CarsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get car details by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CarsController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add a new car to inventory' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [car_dto_1.CreateCarDto]),
    __metadata("design:returntype", Promise)
], CarsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all cars' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CarsController.prototype, "findAll", null);
exports.CarsController = CarsController = __decorate([
    (0, swagger_1.ApiTags)('Cars'),
    (0, common_1.Controller)('cars'),
    __metadata("design:paramtypes", [cars_service_1.CarsService])
], CarsController);
//# sourceMappingURL=cars.controller.js.map