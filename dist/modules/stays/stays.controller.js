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
exports.StaysController = void 0;
const common_1 = require("@nestjs/common");
const stays_service_1 = require("./stays.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_constant_1 = require("../../common/constants/roles.constant");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const stays_dto_1 = require("./dto/stays.dto");
let StaysController = class StaysController {
    constructor(staysService) {
        this.staysService = staysService;
    }
    createStay(createDto) {
        return this.staysService.createStay(createDto);
    }
    searchStays(query) {
        return this.staysService.search(query);
    }
    getStay(id) {
        return this.staysService.getStayById(id);
    }
    addRoom(id, createRoomDto) {
        return this.staysService.addRoom(id, createRoomDto);
    }
    getRooms(id) {
        return this.staysService.getRooms(id);
    }
};
exports.StaysController = StaysController;
__decorate([
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.TENANT_ADMIN, roles_constant_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StaysController.prototype, "createStay", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stays_dto_1.StaySearchDto]),
    __metadata("design:returntype", void 0)
], StaysController.prototype, "searchStays", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StaysController.prototype, "getStay", null);
__decorate([
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.TENANT_ADMIN, roles_constant_1.Role.SUPER_ADMIN),
    (0, common_1.Post)(':id/rooms'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StaysController.prototype, "addRoom", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/rooms'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StaysController.prototype, "getRooms", null);
exports.StaysController = StaysController = __decorate([
    (0, common_1.Controller)('stays'),
    __metadata("design:paramtypes", [stays_service_1.StaysService])
], StaysController);
//# sourceMappingURL=stays.controller.js.map