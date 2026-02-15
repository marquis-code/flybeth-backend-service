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
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const tenant_schema_1 = require("../tenants/schemas/tenant.schema");
const payment_schema_1 = require("../payments/schemas/payment.schema");
const tenants_service_1 = require("../tenants/tenants.service");
const users_service_1 = require("../users/users.service");
const bookings_service_1 = require("../bookings/bookings.service");
let AdminService = AdminService_1 = class AdminService {
    constructor(bookingModel, userModel, tenantModel, paymentModel, tenantsService, usersService, bookingsService) {
        this.bookingModel = bookingModel;
        this.userModel = userModel;
        this.tenantModel = tenantModel;
        this.paymentModel = paymentModel;
        this.tenantsService = tenantsService;
        this.usersService = usersService;
        this.bookingsService = bookingsService;
        this.logger = new common_1.Logger(AdminService_1.name);
    }
    async getDashboard() {
        const [totalTenants, activeTenants, totalUsers, totalBookings, revenueStats, recentBookings,] = await Promise.all([
            this.tenantModel.countDocuments().exec(),
            this.tenantModel.countDocuments({ status: 'active' }).exec(),
            this.userModel.countDocuments().exec(),
            this.bookingModel.countDocuments().exec(),
            this.paymentModel.aggregate([
                { $match: { status: 'success' } },
                {
                    $group: {
                        _id: '$currency',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
            ]).exec(),
            this.bookingModel
                .find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('user', 'firstName lastName email')
                .populate('tenant', 'name slug')
                .lean()
                .exec(),
        ]);
        return {
            overview: {
                totalTenants,
                activeTenants,
                totalUsers,
                totalBookings,
            },
            revenue: {
                byCurrency: revenueStats,
                totalTransactions: revenueStats.reduce((sum, s) => sum + s.count, 0),
            },
            recentBookings,
        };
    }
    async getRevenue(period, tenantId) {
        const matchStage = { status: 'success' };
        if (tenantId)
            matchStage.tenant = new mongoose_2.Types.ObjectId(tenantId);
        let dateFormat;
        switch (period) {
            case 'daily':
                dateFormat = '%Y-%m-%d';
                break;
            case 'monthly':
                dateFormat = '%Y-%m';
                break;
            case 'yearly':
                dateFormat = '%Y';
                break;
            default:
                dateFormat = '%Y-%m';
        }
        const revenue = await this.paymentModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        period: { $dateToString: { format: dateFormat, date: '$paidAt' } },
                        currency: '$currency',
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.period': -1 } },
        ]).exec();
        return revenue;
    }
    async getSystemHealth() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const [recentBookings, recentPayments, activeUsers] = await Promise.all([
            this.bookingModel.countDocuments({ createdAt: { $gte: oneHourAgo } }).exec(),
            this.paymentModel.countDocuments({ createdAt: { $gte: oneHourAgo } }).exec(),
            this.userModel.countDocuments({ lastLogin: { $gte: oneHourAgo } }).exec(),
        ]);
        return {
            status: 'healthy',
            timestamp: now,
            lastHour: {
                bookings: recentBookings,
                payments: recentPayments,
                activeUsers,
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        };
    }
    async getTenants(paginationDto) {
        return this.tenantsService.findAll(paginationDto);
    }
    async getUsers(paginationDto) {
        return this.usersService.findAll(paginationDto);
    }
    async getBookings(paginationDto) {
        return this.bookingsService.getAllBookings(paginationDto);
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(tenant_schema_1.Tenant.name)),
    __param(3, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        tenants_service_1.TenantsService,
        users_service_1.UsersService,
        bookings_service_1.BookingsService])
], AdminService);
//# sourceMappingURL=admin.service.js.map