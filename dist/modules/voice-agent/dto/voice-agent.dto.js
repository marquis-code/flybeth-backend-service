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
exports.SupportQueryDto = exports.ResumeSessionDto = exports.ProcessAudioDto = exports.ProcessTextDto = exports.StartSessionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class StartSessionDto {
}
exports.StartSessionDto = StartSessionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Device or client metadata' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], StartSessionDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Preferred language code (e.g., en, es, fr)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StartSessionDto.prototype, "language", void 0);
class ProcessTextDto {
}
exports.ProcessTextDto = ProcessTextDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User text input', example: 'I want to fly from Lagos to London on March 15' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ProcessTextDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional context' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ProcessTextDto.prototype, "context", void 0);
class ProcessAudioDto {
}
exports.ProcessAudioDto = ProcessAudioDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Audio URL if pre-uploaded' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessAudioDto.prototype, "audioUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Transcription options' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ProcessAudioDto.prototype, "options", void 0);
class ResumeSessionDto {
}
exports.ResumeSessionDto = ResumeSessionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Draft ID to resume from' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ResumeSessionDto.prototype, "draftId", void 0);
class SupportQueryDto {
}
exports.SupportQueryDto = SupportQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Support question or issue', example: 'How do I cancel my booking?' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SupportQueryDto.prototype, "query", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Related booking ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SupportQueryDto.prototype, "bookingId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Context from previous interactions' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], SupportQueryDto.prototype, "context", void 0);
//# sourceMappingURL=voice-agent.dto.js.map