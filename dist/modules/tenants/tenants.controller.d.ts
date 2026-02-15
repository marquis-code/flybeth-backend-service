import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, UpdateTenantStatusDto } from './dto/create-tenant.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { TenantStatus } from '../../common/constants/roles.constant';
export declare class TenantsController {
    private readonly tenantsService;
    constructor(tenantsService: TenantsService);
    create(createTenantDto: CreateTenantDto, userId: string): Promise<import("./schemas/tenant.schema").TenantDocument>;
    findAll(paginationDto: PaginationDto, status?: TenantStatus): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./schemas/tenant.schema").TenantDocument>>;
    findOne(id: string): Promise<import("./schemas/tenant.schema").TenantDocument>;
    findBySlug(slug: string): Promise<import("./schemas/tenant.schema").TenantDocument>;
    update(id: string, updateTenantDto: UpdateTenantDto): Promise<import("./schemas/tenant.schema").TenantDocument>;
    updateStatus(id: string, updateStatusDto: UpdateTenantStatusDto): Promise<import("./schemas/tenant.schema").TenantDocument>;
    remove(id: string): Promise<void>;
    getStats(id: string): Promise<any>;
}
