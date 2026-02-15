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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payments_service_1 = require("./payments.service");
const payment_dto_1 = require("./dto/payment.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_constant_1 = require("../../common/constants/roles.constant");
const mongo_id_validation_pipe_1 = require("../../common/pipes/mongo-id-validation.pipe");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    initialize(userId, dto) {
        return this.paymentsService.initializePayment(userId, dto);
    }
    handleStripeWebhook(req, signature) {
        return this.paymentsService.handleStripeWebhook(req.rawBody, signature);
    }
    handlePaystackWebhook(req, signature) {
        const payload = JSON.stringify(req.body);
        return this.paymentsService.handlePaystackWebhook(payload, signature);
    }
    findOne(id) {
        return this.paymentsService.findById(id);
    }
    findByBooking(bookingId) {
        return this.paymentsService.findByBooking(bookingId);
    }
    refund(id, dto) {
        return this.paymentsService.refund(id, dto);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('initialize'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Initialize a payment for a booking' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('_id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payment_dto_1.InitializePaymentDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "initialize", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('webhook/stripe'),
    (0, swagger_1.ApiOperation)({ summary: 'Stripe webhook endpoint' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "handleStripeWebhook", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('webhook/paystack'),
    (0, swagger_1.ApiOperation)({ summary: 'Paystack webhook endpoint' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('x-paystack-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "handlePaystackWebhook", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get payment by ID' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('booking/:bookingId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get payments for a booking' }),
    __param(0, (0, common_1.Param)('bookingId', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findByBooking", null);
__decorate([
    (0, common_1.Post)(':id/refund'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_constant_1.Role.SUPER_ADMIN, roles_constant_1.Role.TENANT_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Refund a payment' }),
    __param(0, (0, common_1.Param)('id', mongo_id_validation_pipe_1.MongoIdValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payment_dto_1.RefundPaymentDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "refund", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Payments'),
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map