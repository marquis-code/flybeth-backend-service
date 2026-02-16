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
exports.AmadeusOrderDto = exports.AmadeusPriceDto = exports.AmadeusSearchDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class AmadeusSearchDto {
}
exports.AmadeusSearchDto = AmadeusSearchDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SYD', description: 'Origin IATA airport/city code' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusSearchDto.prototype, "originLocationCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'BKK', description: 'Destination IATA airport/city code' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusSearchDto.prototype, "destinationLocationCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-08-01', description: 'Departure date (YYYY-MM-DD)' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AmadeusSearchDto.prototype, "departureDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-08-15', description: 'Return date for round-trip (YYYY-MM-DD)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AmadeusSearchDto.prototype, "returnDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Number of adult travelers', minimum: 1 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(9),
    __metadata("design:type", Number)
], AmadeusSearchDto.prototype, "adults", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0, description: 'Number of child travelers' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AmadeusSearchDto.prototype, "children", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0, description: 'Number of infant travelers' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AmadeusSearchDto.prototype, "infants", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'], description: 'Travel class' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusSearchDto.prototype, "travelClass", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'TG', description: 'Comma-separated airline IATA codes to include' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusSearchDto.prototype, "includedAirlineCodes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'AA,TP', description: 'Comma-separated airline IATA codes to exclude' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusSearchDto.prototype, "excludedAirlineCodes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false, description: 'Only non-stop flights' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AmadeusSearchDto.prototype, "nonStop", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'USD', description: 'Currency code for pricing' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusSearchDto.prototype, "currencyCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1500, description: 'Maximum price filter' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AmadeusSearchDto.prototype, "maxPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5, description: 'Max number of offers to return', default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(250),
    __metadata("design:type", Number)
], AmadeusSearchDto.prototype, "max", void 0);
class AmadeusPriceDto {
}
exports.AmadeusPriceDto = AmadeusPriceDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Wrapper containing the flight offer(s) to price',
        example: {
            type: 'flight-offers-pricing',
            flightOffers: [{}],
        },
    }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], AmadeusPriceDto.prototype, "data", void 0);
class AmadeusTravelerNameDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'JORGE' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusTravelerNameDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'GONZALES' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusTravelerNameDto.prototype, "lastName", void 0);
class AmadeusTravelerPhoneDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MOBILE' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusTravelerPhoneDto.prototype, "deviceType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '34' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusTravelerPhoneDto.prototype, "countryCallingCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '480080076' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusTravelerPhoneDto.prototype, "number", void 0);
class AmadeusTravelerContactDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'jorge@email.com' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusTravelerContactDto.prototype, "emailAddress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [AmadeusTravelerPhoneDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AmadeusTravelerPhoneDto),
    __metadata("design:type", Array)
], AmadeusTravelerContactDto.prototype, "phones", void 0);
class AmadeusTravelerDocumentDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'PASSPORT' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusTravelerDocumentDto.prototype, "documentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusTravelerDocumentDto.prototype, "birthPlace", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusTravelerDocumentDto.prototype, "issuanceLocation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusTravelerDocumentDto.prototype, "issuanceDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusTravelerDocumentDto.prototype, "number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2030-04-14' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusTravelerDocumentDto.prototype, "expiryDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ES' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusTravelerDocumentDto.prototype, "issuanceCountry", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ES' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusTravelerDocumentDto.prototype, "validityCountry", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ES' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusTravelerDocumentDto.prototype, "nationality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AmadeusTravelerDocumentDto.prototype, "holder", void 0);
class AmadeusTravelerDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AmadeusTravelerDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1982-01-16' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AmadeusTravelerDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AmadeusTravelerNameDto),
    __metadata("design:type", AmadeusTravelerNameDto)
], AmadeusTravelerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['MALE', 'FEMALE'] }),
    (0, class_validator_1.IsEnum)(['MALE', 'FEMALE']),
    __metadata("design:type", String)
], AmadeusTravelerDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AmadeusTravelerContactDto),
    __metadata("design:type", AmadeusTravelerContactDto)
], AmadeusTravelerDto.prototype, "contact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [AmadeusTravelerDocumentDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AmadeusTravelerDocumentDto),
    __metadata("design:type", Array)
], AmadeusTravelerDto.prototype, "documents", void 0);
class AmadeusOrderDto {
}
exports.AmadeusOrderDto = AmadeusOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Wrapper containing the priced flight offer(s), travelers, and optional remarks/contacts',
    }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], AmadeusOrderDto.prototype, "data", void 0);
//# sourceMappingURL=amadeus-flight.dto.js.map