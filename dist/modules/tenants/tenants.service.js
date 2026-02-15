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
var TenantsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const cache_manager_1 = require("@nestjs/cache-manager");
const tenant_schema_1 = require("./schemas/tenant.schema");
const pagination_util_1 = require("../../common/utils/pagination.util");
let TenantsService = TenantsService_1 = class TenantsService {
    constructor(tenantModel, cacheManager) {
        this.tenantModel = tenantModel;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(TenantsService_1.name);
    }
    async create(createTenantDto, createdBy) {
        const existing = await this.tenantModel.findOne({
            slug: createTenantDto.slug,
        });
        if (existing) {
            throw new common_1.ConflictException('Tenant with this slug already exists');
        }
        const tenant = new this.tenantModel({
            ...createTenantDto,
            createdBy,
            settings: {
                defaultCurrency: createTenantDto.defaultCurrency || 'USD',
                supportedCurrencies: createTenantDto.supportedCurrencies || ['USD'],
                markupPercentage: createTenantDto.markupPercentage || 0,
                commissionPercentage: createTenantDto.commissionPercentage || 0,
            },
        });
        const saved = await tenant.save();
        this.logger.log(`Tenant created: ${saved.name} (${saved.slug})`);
        return saved;
    }
    async findAll(paginationDto, status) {
        const query = {};
        if (status)
            query.status = status;
        if (paginationDto.search) {
            query.$text = { $search: paginationDto.search };
        }
        return (0, pagination_util_1.paginate)(this.tenantModel, query, paginationDto);
    }
    async findById(id) {
        const cacheKey = `tenant:${id}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached)
            return cached;
        const tenant = await this.tenantModel.findById(id).lean().exec();
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        await this.cacheManager.set(cacheKey, tenant, 600000);
        return tenant;
    }
    async findBySlug(slug) {
        const cacheKey = `tenant:slug:${slug}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached)
            return cached;
        const tenant = await this.tenantModel
            .findOne({ slug })
            .lean()
            .exec();
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        await this.cacheManager.set(cacheKey, tenant, 600000);
        return tenant;
    }
    async update(id, updateTenantDto) {
        const updateData = { ...updateTenantDto };
        if (updateTenantDto.defaultCurrency) {
            updateData['settings.defaultCurrency'] = updateTenantDto.defaultCurrency;
        }
        if (updateTenantDto.supportedCurrencies) {
            updateData['settings.supportedCurrencies'] =
                updateTenantDto.supportedCurrencies;
        }
        if (updateTenantDto.markupPercentage !== undefined) {
            updateData['settings.markupPercentage'] =
                updateTenantDto.markupPercentage;
        }
        if (updateTenantDto.commissionPercentage !== undefined) {
            updateData['settings.commissionPercentage'] =
                updateTenantDto.commissionPercentage;
        }
        const tenant = await this.tenantModel
            .findByIdAndUpdate(id, { $set: updateData }, { new: true })
            .exec();
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        await this.cacheManager.del(`tenant:${id}`);
        await this.cacheManager.del(`tenant:slug:${tenant.slug}`);
        return tenant;
    }
    async updateStatus(id, updateStatusDto) {
        const tenant = await this.tenantModel
            .findByIdAndUpdate(id, { status: updateStatusDto.status }, { new: true })
            .exec();
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        await this.cacheManager.del(`tenant:${id}`);
        return tenant;
    }
    async delete(id) {
        const result = await this.tenantModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        await this.cacheManager.del(`tenant:${id}`);
    }
    async getStats(id) {
        const tenant = await this.findById(id);
        return {
            tenant: tenant.name,
            totalAgents: tenant.totalAgents,
            totalBookings: tenant.totalBookings,
            totalRevenue: tenant.totalRevenue,
            status: tenant.status,
            subscription: tenant.subscription,
        };
    }
    async incrementBookingCount(tenantId, revenue = 0) {
        await this.tenantModel.findByIdAndUpdate(tenantId, {
            $inc: { totalBookings: 1, totalRevenue: revenue },
        });
        await this.cacheManager.del(`tenant:${tenantId}`);
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = TenantsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(tenant_schema_1.Tenant.name)),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [mongoose_2.Model, Object])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map