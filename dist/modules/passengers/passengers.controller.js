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
exports.PassengersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passengers_service_1 = require("./passengers.service");
const passenger_dto_1 = require("./dto/passenger.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const mongo_id_validation_pipe_1 = require("../../common/pipes/mongo-id-validation.pipe");
let PassengersController = class PassengersController {
    constructor(passengersService) {
        this.passengersService = passengersService;
    }
    create(userId, dto) {
        return this.passengersService.create(userId, dto);
    }
    findAll(userId) {
        return this.passengersService.findByUser(userId);
    }
    findOne(id) {
        return this.passengersService.findById(id);
    }
    update(id, userId, dto) {
        return this.passengersService.update(id, userId, dto);
    }
    remove(id, userId) {
        return this.passengersService.delete(id, userId);
    }
};
exports.PassengersController = PassengersController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a saved traveler profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('_id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, passenger_dto_1.CreatePassengerDto]),
    __metadata("design:returntype", void 0)
], PassengersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all saved travelers for current user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PassengersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get traveler by ID' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PassengersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update traveler profile' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('_id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, passenger_dto_1.UpdatePassengerDto]),
    __metadata("design:returntype", void 0)
], PassengersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete traveler profile' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PassengersController.prototype, "remove", null);
exports.PassengersController = PassengersController = __decorate([
    (0, swagger_1.ApiTags)('Passengers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('passengers'),
    __metadata("design:paramtypes", [passengers_service_1.PassengersService])
], PassengersController);
//# sourceMappingURL=passengers.controller.js.map