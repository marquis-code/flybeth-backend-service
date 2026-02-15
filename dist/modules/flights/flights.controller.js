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
exports.FlightsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const flights_service_1 = require("./flights.service");
const flight_dto_1 = require("./dto/flight.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const roles_constant_1 = require("../../common/constants/roles.constant");
const mongo_id_validation_pipe_1 = require("../../common/pipes/mongo-id-validation.pipe");
let FlightsController = class FlightsController {
    constructor(flightsService) {
        this.flightsService = flightsService;
    }
    search(searchDto) {
        return this.flightsService.search(searchDto);
    }
    getPopular(limit) {
        return this.flightsService.getPopularFlights(limit);
    }
    getDeals(limit) {
        return this.flightsService.getDeals(limit);
    }
    findOne(id) {
        return this.flightsService.findById(id);
    }
    create(createFlightDto) {
        return this.flightsService.create(createFlightDto);
    }
    update(id, updateFlightDto) {
        return this.flightsService.update(id, updateFlightDto);
    }
    remove(id) {
        return this.flightsService.delete(id);
    }
};
exports.FlightsController = FlightsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search flights with filters' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [flight_dto_1.SearchFlightsDto]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "search", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('popular'),
    (0, swagger_1.ApiOperation)({ summary: 'Get popular/featured flights' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "getPopular", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('deals'),
    (0, swagger_1.ApiOperation)({ summary: 'Get flight deals (cheapest)' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "getDeals", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get flight by ID' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_ADMIN, roles_constant_1.Role.TENANT_ADMIN, roles_constant_1.Role.AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new flight (Admin/Agent)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [flight_dto_1.CreateFlightDto]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_ADMIN, roles_constant_1.Role.TENANT_ADMIN, roles_constant_1.Role.AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Update flight details' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, flight_dto_1.UpdateFlightDto]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_ADMIN, roles_constant_1.Role.TENANT_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a flight' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FlightsController.prototype, "remove", null);
exports.FlightsController = FlightsController = __decorate([
    (0, swagger_1.ApiTags)('Flights'),
    (0, common_1.Controller)('flights'),
    __metadata("design:paramtypes", [flights_service_1.FlightsService])
], FlightsController);
//# sourceMappingURL=flights.controller.js.map