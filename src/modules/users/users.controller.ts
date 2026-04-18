// src/modules/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import {
  UpdateUserDto,
  UpdateUserRoleDto,
  UpdateAgentStatusDto,
  UserQueryDto,
} from "./dto/update-user.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Role } from "../../common/constants/roles.constant";
import { MongoIdValidationPipe } from "../../common/pipes/mongo-id-validation.pipe";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.AGENT)
  @ApiOperation({ summary: "Create a new user (Admin/Agent only)" })
  create(@Body() createUserDto: any, @CurrentUser("tenant") tenantId: string) {
    if (tenantId) createUserDto.tenant = tenantId;
    return this.usersService.create({ ...createUserDto, isVerified: true, firstLogin: false });
  }

  @Get("admins")
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.AGENT, Role.STAFF)
  @ApiOperation({ summary: "Get all administrative users for support" })
  findAdmins() {
    return this.usersService.findAdmins();
  }

  @Get("me")
  @ApiOperation({ summary: "Get current authenticated user profile" })
  getProfile(@CurrentUser("_id") userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current user profile" })
  updateProfile(
    @CurrentUser("_id") userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, updateUserDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.AGENT)
  @ApiOperation({ summary: "List all users (Admin/Agent only)" })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query() queryDto: UserQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.findAll(paginationDto, queryDto, user);
  }

  @Get(":id")
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: "Get user by ID" })
  findOne(@Param("id", MongoIdValidationPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Patch(":id/role")
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: "Update user role" })
  updateRole(
    @Param("id", MongoIdValidationPipe) id: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(id, updateRoleDto);
  }

  @Patch(":id/agent-status")
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: "Update agent status" })
  updateAgentStatus(
    @Param("id", MongoIdValidationPipe) id: string,
    @Body() updateAgentStatusDto: UpdateAgentStatusDto,
  ) {
    return this.usersService.updateAgentStatus(id, updateAgentStatusDto.status);
  }
}
