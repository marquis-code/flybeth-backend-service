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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bookings_service_1 = require("./bookings.service");
const booking_dto_1 = require("./dto/booking.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_constant_1 = require("../../common/constants/roles.constant");
const mongo_id_validation_pipe_1 = require("../../common/pipes/mongo-id-validation.pipe");
let BookingsController = class BookingsController {
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    create(userId, createBookingDto) {
        return this.bookingsService.create(userId, createBookingDto);
    }
    findMyBookings(userId, paginationDto, queryDto) {
        return this.bookingsService.findUserBookings(userId, paginationDto, queryDto);
    }
    findAll(paginationDto, queryDto) {
        return this.bookingsService.getAllBookings(paginationDto, queryDto);
    }
    getStats(tenantId) {
        return this.bookingsService.getStats(tenantId);
    }
    findByPNR(pnr) {
        return this.bookingsService.findByPNR(pnr);
    }
    findTenantBookings(tenantId, paginationDto, queryDto) {
        return this.bookingsService.findTenantBookings(tenantId, paginationDto, queryDto);
    }
    findOne(id) {
        return this.bookingsService.findById(id);
    }
    cancel(id, userId, cancelDto) {
        return this.bookingsService.cancelBooking(id, userId, cancelDto);
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new booking' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('_id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, booking_dto_1.CreateBookingDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user bookings' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('_id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_dto_1.PaginationDto,
        booking_dto_1.BookingQueryDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "findMyBookings", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all bookings (Super Admin)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto,
        booking_dto_1.BookingQueryDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_ADMIN, roles_constant_1.Role.TENANT_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get booking statistics' }),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('reference/:pnr'),
    (0, swagger_1.ApiOperation)({ summary: 'Get booking by PNR reference' }),
    __param(0, (0, common_1.Param)('pnr')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "findByPNR", null);
__decorate([
    (0, common_1.Get)('tenant/:tenantId'),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_ADMIN, roles_constant_1.Role.TENANT_ADMIN, roles_constant_1.Role.AGENT),
    (0, swagger_1.ApiOperation)({ summary: 'Get bookings for a tenant' }),
    __param(0, (0, common_1.Param)('tenantId', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_dto_1.PaginationDto,
        booking_dto_1.BookingQueryDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "findTenantBookings", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get booking by ID' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a booking' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('_id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, booking_dto_1.CancelBookingDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "cancel", null);
exports.BookingsController = BookingsController = __decorate([
    (0, swagger_1.ApiTags)('Bookings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('bookings'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map