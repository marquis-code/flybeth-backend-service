// src/common/guards/agent-status.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role, AgentStatus } from "../constants/roles.constant";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class AgentStatusGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
    ]);
  
    if (isPublic) {
        return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Aggressive safety: System Owner bypasses all status checks
    if (user?.email === 'abahmarquis@gmail.com') {
        return true;
    }

    // Only applies to AGENT role
    if (user.role !== Role.AGENT) {
      return true;
    }

    // Check if agent is approved
    if (user.agentStatus !== AgentStatus.APPROVED) {
      throw new ForbiddenException(
        `Your agent account status is ${user.agentStatus}. Access to booking is restricted until approval.`,
      );
    }

    return true;
  }
}
