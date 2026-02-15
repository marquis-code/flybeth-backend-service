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
exports.TenantsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tenants_service_1 = require("./tenants.service");
const create_tenant_dto_1 = require("./dto/create-tenant.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_constant_1 = require("../../common/constants/roles.constant");
const mongo_id_validation_pipe_1 = require("../../common/pipes/mongo-id-validation.pipe");
let TenantsController = class TenantsController {
    constructor(tenantsService) {
        this.tenantsService = tenantsService;
    }
    create(createTenantDto, userId) {
        return this.tenantsService.create(createTenantDto, userId);
    }
    findAll(paginationDto, status) {
        return this.tenantsService.findAll(paginationDto, status);
    }
    findOne(id) {
        return this.tenantsService.findById(id);
    }
    findBySlug(slug) {
        return this.tenantsService.findBySlug(slug);
    }
    update(id, updateTenantDto) {
        return this.tenantsService.update(id, updateTenantDto);
    }
    updateStatus(id, updateStatusDto) {
        return this.tenantsService.updateStatus(id, updateStatusDto);
    }
    remove(id) {
        return this.tenantsService.delete(id);
    }
    getStats(id) {
        return this.tenantsService.getStats(id);
    }
};
exports.TenantsController = TenantsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new tenant (Super Admin only)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tenant_dto_1.CreateTenantDto, String]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List all tenants with pagination' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto, String]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tenant by ID' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('slug/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tenant by slug' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_ADMIN, roles_constant_1.Role.TENANT_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update tenant details' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_tenant_dto_1.UpdateTenantDto]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update tenant status (activate/suspend)' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_tenant_dto_1.UpdateTenantStatusDto]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete tenant (Super Admin only)' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_ADMIN, roles_constant_1.Role.TENANT_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get tenant statistics' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "getStats", null);
exports.TenantsController = TenantsController = __decorate([
    (0, swagger_1.ApiTags)('Tenants'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenants'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService])
], TenantsController);
//# sourceMappingURL=tenants.controller.js.map