import { Model } from 'mongoose';
import { Cache } from 'cache-manager';
import { TenantDocument } from './schemas/tenant.schema';
import { CreateTenantDto, UpdateTenantDto, UpdateTenantStatusDto } from './dto/create-tenant.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/utils/pagination.util';
import { TenantStatus } from '../../common/constants/roles.constant';
export declare class TenantsService {
    private tenantModel;
    private cacheManager;
    private readonly logger;
    constructor(tenantModel: Model<TenantDocument>, cacheManager: Cache);
    create(createTenantDto: CreateTenantDto, createdBy: string): Promise<TenantDocument>;
    findAll(paginationDto: PaginationDto, status?: TenantStatus): Promise<PaginatedResult<TenantDocument>>;
    findById(id: string): Promise<TenantDocument>;
    findBySlug(slug: string): Promise<TenantDocument>;
    update(id: string, updateTenantDto: UpdateTenantDto): Promise<TenantDocument>;
    updateStatus(id: string, updateStatusDto: UpdateTenantStatusDto): Promise<TenantDocument>;
    delete(id: string): Promise<void>;
    getStats(id: string): Promise<any>;
    incrementBookingCount(tenantId: string, revenue?: number): Promise<void>;
}
