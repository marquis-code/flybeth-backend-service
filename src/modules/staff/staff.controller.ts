// src/modules/staff/staff.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Patch,
} from "@nestjs/common";
import { StaffService } from "./staff.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role, Permission } from "../../common/constants/roles.constant";

@Controller("staff")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  async createStaff(@Req() req, @Body() body: any) {
    const adminId = req.user.sub;
    return this.staffService.createStaff(adminId, body);
  }

  @Get("tenant/:id")
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  async getStaff(@Param("id") tenantId: string) {
    return this.staffService.getStaffByTenant(tenantId);
  }

  @Patch(":id/permissions")
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  async updatePermissions(
    @Param("id") staffId: string,
    @Body("permissions") permissions: Permission[],
  ) {
    return this.staffService.updateStaffPermissions(staffId, permissions);
  }

  @Delete(":id")
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  async removeStaff(@Param("id") staffId: string) {
    return this.staffService.deleteStaff(staffId);
  }
}
