import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto, UpdateUserRoleDto, UserQueryDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/utils/pagination.util';
export declare class UsersService {
    private userModel;
    private readonly logger;
    constructor(userModel: Model<UserDocument>);
    create(userData: Partial<User>): Promise<UserDocument>;
    findByEmail(email: string, selectPassword?: boolean): Promise<UserDocument | null>;
    findById(id: string): Promise<UserDocument>;
    findAll(paginationDto: PaginationDto, queryDto?: UserQueryDto): Promise<PaginatedResult<UserDocument>>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument>;
    updateRole(id: string, updateRoleDto: UpdateUserRoleDto): Promise<UserDocument>;
    updateRefreshToken(id: string, refreshToken: string | null): Promise<void>;
    updateLastLogin(id: string): Promise<void>;
    setOTP(id: string, otp: string): Promise<void>;
    verifyOTP(email: string, otp: string): Promise<UserDocument | null>;
    setResetToken(email: string, token: string): Promise<void>;
    findByResetToken(token: string): Promise<UserDocument | null>;
    resetPassword(userId: string, newPassword: string): Promise<void>;
    getTenantUsers(tenantId: string, paginationDto: PaginationDto): Promise<PaginatedResult<UserDocument>>;
}
