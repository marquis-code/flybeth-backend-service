// src/modules/users/users.controller.ts
import {
    Controller,
    Get,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, UpdateUserRoleDto, UserQueryDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/constants/roles.constant';
import { MongoIdValidationPipe } from '../../common/pipes/mongo-id-validation.pipe';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @ApiOperation({ summary: 'Get current authenticated user profile' })
    getProfile(@CurrentUser('_id') userId: string) {
        return this.usersService.findById(userId);
    }

    @Patch('me')
    @ApiOperation({ summary: 'Update current user profile' })
    updateProfile(
        @CurrentUser('_id') userId: string,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.usersService.update(userId, updateUserDto);
    }

    @Get()
    @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
    @ApiOperation({ summary: 'List all users (Admin only)' })
    findAll(
        @Query() paginationDto: PaginationDto,
        @Query() queryDto: UserQueryDto,
    ) {
        return this.usersService.findAll(paginationDto, queryDto);
    }

    @Get(':id')
    @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
    @ApiOperation({ summary: 'Get user by ID' })
    findOne(@Param('id', MongoIdValidationPipe) id: string) {
        return this.usersService.findById(id);
    }

    @Patch(':id/role')
    @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
    @ApiOperation({ summary: 'Update user role' })
    updateRole(
        @Param('id', MongoIdValidationPipe) id: string,
        @Body() updateRoleDto: UpdateUserRoleDto,
    ) {
        return this.usersService.updateRole(id, updateRoleDto);
    }
}
