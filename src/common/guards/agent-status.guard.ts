// src/common/guards/agent-status.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role, AgentStatus } from "../constants/roles.constant";

@Injectable()
export class AgentStatusGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
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
