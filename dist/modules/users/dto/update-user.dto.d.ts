import { Role } from '../../../common/constants/roles.constant';
export declare class UpdateUserDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    currency?: string;
    language?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
}
export declare class UpdateUserRoleDto {
    role: Role;
}
export declare class UserQueryDto {
    tenant?: string;
    role?: Role;
    isActive?: boolean;
}
