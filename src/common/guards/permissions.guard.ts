import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Permission, Role } from "../constants/roles.constant";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();

    const userRole = typeof user?.role === 'object' ? user.role?.name : user?.role;

    // Super Admins and System Owner bypass permission checks
    if (userRole === Role.SUPER_ADMIN || user?.email === 'abahmarquis@gmail.com') {
      return true;
    }

    if (!user?.permissions) return false;

    // If user has 'all' permissions (from seed), they can access everything
    if (user.permissions.includes('all')) return true;

    return requiredPermissions.every((permission) =>
      user.permissions?.includes(permission),
    );
  }
}
