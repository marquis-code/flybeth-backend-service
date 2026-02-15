"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./schemas/user.schema");
const pagination_util_1 = require("../../common/utils/pagination.util");
const crypto_util_1 = require("../../common/utils/crypto.util");
let UsersService = UsersService_1 = class UsersService {
    constructor(userModel) {
        this.userModel = userModel;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async create(userData) {
        const existing = await this.userModel.findOne({ email: userData.email });
        if (existing) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        if (userData.password) {
            userData.password = await (0, crypto_util_1.hashPassword)(userData.password);
        }
        const user = new this.userModel(userData);
        return user.save();
    }
    async findByEmail(email, selectPassword = false) {
        const query = this.userModel.findOne({ email: email.toLowerCase() });
        if (selectPassword) {
            query.select('+password +refreshToken');
        }
        return query.populate('tenant').exec();
    }
    async findById(id) {
        const user = await this.userModel
            .findById(id)
            .populate('tenant')
            .lean()
            .exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findAll(paginationDto, queryDto) {
        const query = {};
        if (queryDto?.tenant)
            query.tenant = queryDto.tenant;
        if (queryDto?.role)
            query.role = queryDto.role;
        if (queryDto?.isActive !== undefined)
            query.isActive = queryDto.isActive;
        if (paginationDto.search) {
            query.$text = { $search: paginationDto.search };
        }
        return (0, pagination_util_1.paginate)(this.userModel, query, paginationDto, 'tenant');
    }
    async update(id, updateUserDto) {
        const updateData = {};
        if (updateUserDto.firstName)
            updateData.firstName = updateUserDto.firstName;
        if (updateUserDto.lastName)
            updateData.lastName = updateUserDto.lastName;
        if (updateUserDto.phone)
            updateData.phone = updateUserDto.phone;
        if (updateUserDto.avatar)
            updateData.avatar = updateUserDto.avatar;
        if (updateUserDto.currency)
            updateData['preferences.currency'] = updateUserDto.currency;
        if (updateUserDto.language)
            updateData['preferences.language'] = updateUserDto.language;
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
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async updateRole(id, updateRoleDto) {
        const user = await this.userModel
            .findByIdAndUpdate(id, { role: updateRoleDto.role }, { new: true })
            .exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async updateRefreshToken(id, refreshToken) {
        await this.userModel.findByIdAndUpdate(id, { refreshToken }).exec();
    }
    async updateLastLogin(id) {
        await this.userModel
            .findByIdAndUpdate(id, { lastLogin: new Date() })
            .exec();
    }
    async setOTP(id, otp) {
        const expiry = new Date(Date.now() + 10 * 60 * 1000);
        await this.userModel
            .findByIdAndUpdate(id, { otp, otpExpiry: expiry })
            .exec();
    }
    async verifyOTP(email, otp) {
        return this.userModel
            .findOneAndUpdate({
            email,
            otp,
            otpExpiry: { $gt: new Date() },
        }, {
            isVerified: true,
            $unset: { otp: 1, otpExpiry: 1 },
        }, { new: true })
            .exec();
    }
    async setResetToken(email, token) {
        const expiry = new Date(Date.now() + 60 * 60 * 1000);
        await this.userModel
            .findOneAndUpdate({ email }, { resetToken: token, resetTokenExpiry: expiry })
            .exec();
    }
    async findByResetToken(token) {
        return this.userModel
            .findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() },
        })
            .select('+resetToken')
            .exec();
    }
    async resetPassword(userId, newPassword) {
        const hashedPassword = await (0, crypto_util_1.hashPassword)(newPassword);
        await this.userModel
            .findByIdAndUpdate(userId, {
            password: hashedPassword,
            $unset: { resetToken: 1, resetTokenExpiry: 1 },
        })
            .exec();
    }
    async getTenantUsers(tenantId, paginationDto) {
        return (0, pagination_util_1.paginate)(this.userModel, { tenant: tenantId }, paginationDto);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map