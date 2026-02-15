// src/modules/users/users.service.ts
import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto, UpdateUserRoleDto, UserQueryDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate, PaginatedResult } from '../../common/utils/pagination.util';
import { hashPassword } from '../../common/utils/crypto.util';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async create(userData: Partial<User>): Promise<UserDocument> {
        const existing = await this.userModel.findOne({ email: userData.email });
        if (existing) {
            throw new ConflictException('User with this email already exists');
        }

        if (userData.password) {
            userData.password = await hashPassword(userData.password);
        }

        const user = new this.userModel(userData);
        return user.save();
    }

    async findByEmail(email: string, selectPassword = false): Promise<UserDocument | null> {
        const query = this.userModel.findOne({ email: email.toLowerCase() });
        if (selectPassword) {
            query.select('+password +refreshToken');
        }
        return query.populate('tenant').exec();
    }

    async findById(id: string): Promise<UserDocument> {
        const user = await this.userModel
            .findById(id)
            .populate('tenant')
            .lean()
            .exec();

        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user as unknown as UserDocument;
    }

    async findAll(
        paginationDto: PaginationDto,
        queryDto?: UserQueryDto,
    ): Promise<PaginatedResult<UserDocument>> {
        const query: any = {};

        if (queryDto?.tenant) query.tenant = queryDto.tenant;
        if (queryDto?.role) query.role = queryDto.role;
        if (queryDto?.isActive !== undefined) query.isActive = queryDto.isActive;
        if (paginationDto.search) {
            query.$text = { $search: paginationDto.search };
        }

        return paginate(this.userModel, query, paginationDto, 'tenant');
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
        const updateData: any = {};

        // Map flat DTO fields to nested schema
        if (updateUserDto.firstName) updateData.firstName = updateUserDto.firstName;
        if (updateUserDto.lastName) updateData.lastName = updateUserDto.lastName;
        if (updateUserDto.phone) updateData.phone = updateUserDto.phone;
        if (updateUserDto.avatar) updateData.avatar = updateUserDto.avatar;
        if (updateUserDto.currency) updateData['preferences.currency'] = updateUserDto.currency;
        if (updateUserDto.language) updateData['preferences.language'] = updateUserDto.language;
        if (updateUserDto.emailNotifications !== undefined) {
            updateData['preferences.emailNotifications'] = updateUserDto.emailNotifications;
        }
        if (updateUserDto.pushNotifications !== undefined) {
            updateData['preferences.pushNotifications'] = updateUserDto.pushNotifications;
        }

        const user = await this.userModel
            .findByIdAndUpdate(id, { $set: updateData }, { new: true })
            .populate('tenant')
            .exec();

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateRole(id: string, updateRoleDto: UpdateUserRoleDto): Promise<UserDocument> {
        const user = await this.userModel
            .findByIdAndUpdate(id, { role: updateRoleDto.role }, { new: true })
            .exec();

        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
        await this.userModel.findByIdAndUpdate(id, { refreshToken }).exec();
    }

    async updateLastLogin(id: string): Promise<void> {
        await this.userModel
            .findByIdAndUpdate(id, { lastLogin: new Date() })
            .exec();
    }

    async setOTP(id: string, otp: string): Promise<void> {
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await this.userModel
            .findByIdAndUpdate(id, { otp, otpExpiry: expiry })
            .exec();
    }

    async verifyOTP(email: string, otp: string): Promise<UserDocument | null> {
        return this.userModel
            .findOneAndUpdate(
                {
                    email,
                    otp,
                    otpExpiry: { $gt: new Date() },
                },
                {
                    isVerified: true,
                    $unset: { otp: 1, otpExpiry: 1 },
                },
                { new: true },
            )
            .exec();
    }

    async setResetToken(email: string, token: string): Promise<void> {
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await this.userModel
            .findOneAndUpdate(
                { email },
                { resetToken: token, resetTokenExpiry: expiry },
            )
            .exec();
    }

    async findByResetToken(token: string): Promise<UserDocument | null> {
        return this.userModel
            .findOne({
                resetToken: token,
                resetTokenExpiry: { $gt: new Date() },
            })
            .select('+resetToken')
            .exec();
    }

    async resetPassword(userId: string, newPassword: string): Promise<void> {
        const hashedPassword = await hashPassword(newPassword);
        await this.userModel
            .findByIdAndUpdate(userId, {
                password: hashedPassword,
                $unset: { resetToken: 1, resetTokenExpiry: 1 },
            })
            .exec();
    }

    async getTenantUsers(tenantId: string, paginationDto: PaginationDto): Promise<PaginatedResult<UserDocument>> {
        return paginate(
            this.userModel,
            { tenant: tenantId },
            paginationDto,
        );
    }
}
