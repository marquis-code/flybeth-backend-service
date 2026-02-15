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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFlightDto = exports.SearchFlightsDto = exports.CreateFlightDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const roles_constant_1 = require("../../../common/constants/roles.constant");
class AirportDetailDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'JFK' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AirportDetailDto.prototype, "airport", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'New York' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AirportDetailDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'United States' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AirportDetailDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'T4' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AirportDetailDto.prototype, "terminal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'G12' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AirportDetailDto.prototype, "gate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-06-15T08:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AirportDetailDto.prototype, "time", void 0);
class FlightClassDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ enum: roles_constant_1.FlightClass }),
    (0, class_validator_1.IsEnum)(roles_constant_1.FlightClass),
    __metadata("design:type", String)
], FlightClassDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 350 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], FlightClassDto.prototype, "basePrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'USD' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FlightClassDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 150 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], FlightClassDto.prototype, "seatsAvailable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 200 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], FlightClassDto.prototype, "seatsTotal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '23kg checked + 7kg carry-on' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FlightClassDto.prototype, "baggage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], FlightClassDto.prototype, "amenities", void 0);
class CreateFlightDto {
}
exports.CreateFlightDto = CreateFlightDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Emirates' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFlightDto.prototype, "airline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'EK401' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFlightDto.prototype, "flightNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Boeing 777-300ER' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFlightDto.prototype, "aircraft", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AirportDetailDto),
    __metadata("design:type", AirportDetailDto)
], CreateFlightDto.prototype, "departure", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AirportDetailDto),
    __metadata("design:type", AirportDetailDto)
], CreateFlightDto.prototype, "arrival", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 480, description: 'Duration in minutes' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateFlightDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateFlightDto.prototype, "stops", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FlightClassDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FlightClassDto),
    __metadata("design:type", Array)
], CreateFlightDto.prototype, "classes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFlightDto.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFlightDto.prototype, "isFeatured", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['MON', 'WED', 'FRI'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateFlightDto.prototype, "operatingDays", void 0);
class SearchFlightsDto {
}
exports.SearchFlightsDto = SearchFlightsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'JFK', description: 'Origin airport IATA code' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchFlightsDto.prototype, "origin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'LHR', description: 'Destination airport IATA code' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchFlightsDto.prototype, "destination", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-06-15' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SearchFlightsDto.prototype, "departureDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-06-22' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SearchFlightsDto.prototype, "returnDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SearchFlightsDto.prototype, "adults", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SearchFlightsDto.prototype, "children", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SearchFlightsDto.prototype, "infantsOnLap", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SearchFlightsDto.prototype, "infantsInSeat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: roles_constant_1.FlightClass }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(roles_constant_1.FlightClass),
    __metadata("design:type", String)
], SearchFlightsDto.prototype, "class", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Minimum price filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SearchFlightsDto.prototype, "minPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Maximum price filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SearchFlightsDto.prototype, "maxPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by airline' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchFlightsDto.prototype, "airline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Maximum stops (0 for direct)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SearchFlightsDto.prototype, "maxStops", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['price', 'duration', 'departure', 'arrival'], default: 'price' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchFlightsDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['asc', 'desc'], default: 'asc' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchFlightsDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Currency for price display', default: 'USD' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchFlightsDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SearchFlightsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SearchFlightsDto.prototype, "limit", void 0);
class UpdateFlightDto {
}
exports.UpdateFlightDto = UpdateFlightDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateFlightDto.prototype, "aircraft", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: roles_constant_1.FlightStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(roles_constant_1.FlightStatus),
    __metadata("design:type", String)
], UpdateFlightDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FlightClassDto),
    __metadata("design:type", Array)
], UpdateFlightDto.prototype, "classes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateFlightDto.prototype, "isFeatured", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateFlightDto.prototype, "isActive", void 0);
//# sourceMappingURL=flight.dto.js.map