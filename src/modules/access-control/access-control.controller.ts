import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccessControlService } from './access-control.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.constant';

@ApiTags('Access Control')
@ApiBearerAuth()
@Controller('access-control')
@UseGuards(RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AccessControlController {
  constructor(private readonly acService: AccessControlService) {}

  @Get('roles')
  @ApiOperation({ summary: 'List all architectural roles' })
  getRoles() {
    return this.acService.findAllRoles();
  }

  @Post('roles')
  @ApiOperation({ summary: 'Architect a new security role' })
  createRole(@Body() data: any) {
    return this.acService.createRole(data);
  }

  @Put('roles/:id')
  @ApiOperation({ summary: 'Update an existing security policy' })
  updateRole(@Param('id') id: string, @Body() data: any) {
    return this.acService.updateRole(id, data);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Deconstruct a custom role' })
  deleteRole(@Param('id') id: string) {
    return this.acService.deleteRole(id);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List all available system permissions' })
  getPermissions() {
    return this.acService.findAllPermissions();
  }

  @Post('permissions')
  @ApiOperation({ summary: 'Register a new system permission' })
  createPermission(@Body() data: any) {
    return this.acService.createPermission(data);
  }
}
