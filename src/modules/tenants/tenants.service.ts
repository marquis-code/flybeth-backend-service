// src/modules/tenants/tenants.service.ts
import {
    Injectable,
    ConflictException,
    NotFoundException,
    Inject,
    Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Tenant, TenantDocument } from './schemas/tenant.schema';
import {
    CreateTenantDto,
    UpdateTenantDto,
    UpdateTenantStatusDto,
} from './dto/create-tenant.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate, PaginatedResult } from '../../common/utils/pagination.util';
import { TenantStatus } from '../../common/constants/roles.constant';

@Injectable()
export class TenantsService {
    private readonly logger = new Logger(TenantsService.name);

    constructor(
        @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async create(
        createTenantDto: CreateTenantDto,
        createdBy: string,
    ): Promise<TenantDocument> {
        const existing = await this.tenantModel.findOne({
            slug: createTenantDto.slug,
        });

        if (existing) {
            throw new ConflictException('Tenant with this slug already exists');
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

    async findAll(
        paginationDto: PaginationDto,
        status?: TenantStatus,
    ): Promise<PaginatedResult<TenantDocument>> {
        const query: any = {};
        if (status) query.status = status;
        if (paginationDto.search) {
            query.$text = { $search: paginationDto.search };
        }
        return paginate(this.tenantModel, query, paginationDto);
    }

    async findById(id: string): Promise<TenantDocument> {
        const cacheKey = `tenant:${id}`;
        const cached = await this.cacheManager.get<TenantDocument>(cacheKey);
        if (cached) return cached;

        const tenant = await this.tenantModel.findById(id).lean().exec();
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        await this.cacheManager.set(cacheKey, tenant, 600000); // 10 min
        return tenant as unknown as TenantDocument;
    }

    async findBySlug(slug: string): Promise<TenantDocument> {
        const cacheKey = `tenant:slug:${slug}`;
        const cached = await this.cacheManager.get<TenantDocument>(cacheKey);
        if (cached) return cached;

        const tenant = await this.tenantModel
            .findOne({ slug })
            .lean()
            .exec();
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        await this.cacheManager.set(cacheKey, tenant, 600000);
        return tenant as unknown as TenantDocument;
    }

    async update(
        id: string,
        updateTenantDto: UpdateTenantDto,
    ): Promise<TenantDocument> {
        const updateData: any = { ...updateTenantDto };

        // Handle nested settings updates
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
            throw new NotFoundException('Tenant not found');
        }

        // Invalidate cache
        await this.cacheManager.del(`tenant:${id}`);
        await this.cacheManager.del(`tenant:slug:${tenant.slug}`);

        return tenant;
    }

    async updateStatus(
        id: string,
        updateStatusDto: UpdateTenantStatusDto,
    ): Promise<TenantDocument> {
        const tenant = await this.tenantModel
            .findByIdAndUpdate(
                id,
                { status: updateStatusDto.status },
                { new: true },
            )
            .exec();

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        await this.cacheManager.del(`tenant:${id}`);
        return tenant;
    }

    async delete(id: string): Promise<void> {
        const result = await this.tenantModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException('Tenant not found');
        }
        await this.cacheManager.del(`tenant:${id}`);
    }

    async getStats(id: string): Promise<any> {
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

    async incrementBookingCount(tenantId: string, revenue: number = 0): Promise<void> {
        await this.tenantModel.findByIdAndUpdate(tenantId, {
            $inc: { totalBookings: 1, totalRevenue: revenue },
        });
        await this.cacheManager.del(`tenant:${tenantId}`);
    }
}
