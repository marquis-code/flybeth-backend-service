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
exports.BookingQueryDto = exports.CancelBookingDto = exports.CreateBookingDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const stays_dto_1 = require("../../stays/dto/stays.dto");
class BookingStayDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Stay/Hotel ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingStayDto.prototype, "hotelId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Room ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingStayDto.prototype, "roomId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingStayDto.prototype, "checkIn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingStayDto.prototype, "checkOut", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => stays_dto_1.OccupancyDto),
    __metadata("design:type", stays_dto_1.OccupancyDto)
], BookingStayDto.prototype, "occupancy", void 0);
class BookingCarDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingCarDto.prototype, "carId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingCarDto.prototype, "pickUpDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingCarDto.prototype, "dropOffDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingCarDto.prototype, "pickUpLocation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingCarDto.prototype, "dropOffLocation", void 0);
class BookingFlightDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Flight ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingFlightDto.prototype, "flightId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'economy' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingFlightDto.prototype, "class", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Array of passenger IDs' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BookingFlightDto.prototype, "passengerIds", void 0);
class BookingCruiseDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingCruiseDto.prototype, "cruiseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingCruiseDto.prototype, "cabinType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingCruiseDto.prototype, "departureDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BookingCruiseDto.prototype, "passengerIds", void 0);
class BookingContactDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], BookingContactDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+1234567890' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingContactDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'John Doe' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingContactDto.prototype, "name", void 0);
class CreateBookingDto {
}
exports.CreateBookingDto = CreateBookingDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [BookingFlightDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BookingFlightDto),
    __metadata("design:type", Array)
], CreateBookingDto.prototype, "flights", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [BookingStayDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BookingStayDto),
    __metadata("design:type", Array)
], CreateBookingDto.prototype, "stays", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [BookingCarDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BookingCarDto),
    __metadata("design:type", Array)
], CreateBookingDto.prototype, "cars", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [BookingCruiseDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BookingCruiseDto),
    __metadata("design:type", Array)
], CreateBookingDto.prototype, "cruises", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => BookingContactDto),
    __metadata("design:type", BookingContactDto)
], CreateBookingDto.prototype, "contactDetails", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tenant ID for B2B booking' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Package ID if booking a bundle' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "packageId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Currency for pricing', default: 'USD' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateBookingDto.prototype, "isRoundTrip", void 0);
class CancelBookingDto {
}
exports.CancelBookingDto = CancelBookingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Change of plans' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CancelBookingDto.prototype, "reason", void 0);
class BookingQueryDto {
}
exports.BookingQueryDto = BookingQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['pending', 'confirmed', 'ticketed', 'cancelled', 'refunded', 'expired'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingQueryDto.prototype, "tenantId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BookingQueryDto.prototype, "endDate", void 0);
//# sourceMappingURL=booking.dto.js.map