import { UsersService } from './users.service';
import { UpdateUserDto, UpdateUserRoleDto, UserQueryDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(userId: string): Promise<import("./schemas/user.schema").UserDocument>;
    updateProfile(userId: string, updateUserDto: UpdateUserDto): Promise<import("./schemas/user.schema").UserDocument>;
    findAll(paginationDto: PaginationDto, queryDto: UserQueryDto): Promise<import("../../common/utils/pagination.util").PaginatedResult<import("./schemas/user.schema").UserDocument>>;
    findOne(id: string): Promise<import("./schemas/user.schema").UserDocument>;
    updateRole(id: string, updateRoleDto: UpdateUserRoleDto): Promise<import("./schemas/user.schema").UserDocument>;
}
