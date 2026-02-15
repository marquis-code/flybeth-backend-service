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
exports.AirportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const airports_service_1 = require("./airports.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let AirportsController = class AirportsController {
    constructor(airportsService) {
        this.airportsService = airportsService;
    }
    searchAirports(query, limit) {
        return this.airportsService.searchAirports(query, limit);
    }
    getAllAirports() {
        return this.airportsService.getAllAirports();
    }
    getAirport(code) {
        return this.airportsService.getAirportByCode(code);
    }
    searchAirlines(query, limit) {
        return this.airportsService.searchAirlines(query, limit);
    }
    getAllAirlines() {
        return this.airportsService.getAllAirlines();
    }
    getAirline(code) {
        return this.airportsService.getAirlineByCode(code);
    }
};
exports.AirportsController = AirportsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('airports/search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search airports by name, city, or code' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], AirportsController.prototype, "searchAirports", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('airports'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all airports' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AirportsController.prototype, "getAllAirports", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('airports/:code'),
    (0, swagger_1.ApiOperation)({ summary: 'Get airport by IATA code' }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AirportsController.prototype, "getAirport", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('airlines/search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search airlines by name or code' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], AirportsController.prototype, "searchAirlines", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('airlines'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all airlines' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AirportsController.prototype, "getAllAirlines", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('airlines/:code'),
    (0, swagger_1.ApiOperation)({ summary: 'Get airline by IATA code' }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AirportsController.prototype, "getAirline", null);
exports.AirportsController = AirportsController = __decorate([
    (0, swagger_1.ApiTags)('Airports & Airlines'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [airports_service_1.AirportsService])
], AirportsController);
//# sourceMappingURL=airports.controller.js.map