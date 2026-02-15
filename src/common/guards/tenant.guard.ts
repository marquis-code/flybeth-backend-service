// src/common/guards/tenant.guard.ts
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Role } from '../constants/roles.constant';

@Injectable()
export class TenantGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Super admins can access all tenants
        if (user?.role === Role.SUPER_ADMIN) {
            return true;
        }

        // For tenant-scoped routes, ensure user belongs to the requested tenant
        const tenantIdParam = request.params?.tenantId;
        if (tenantIdParam && user?.tenant?.toString() !== tenantIdParam) {
            throw new ForbiddenException('Access denied to this tenant');
        }

        return true;
    }
}
