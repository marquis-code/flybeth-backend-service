"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const tenant_schema_1 = require("../tenants/schemas/tenant.schema");
const payment_schema_1 = require("../payments/schemas/payment.schema");
const tenants_module_1 = require("../tenants/tenants.module");
const users_module_1 = require("../users/users.module");
const bookings_module_1 = require("../bookings/bookings.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: booking_schema_1.Booking.name, schema: booking_schema_1.BookingSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: tenant_schema_1.Tenant.name, schema: tenant_schema_1.TenantSchema },
                { name: payment_schema_1.Payment.name, schema: payment_schema_1.PaymentSchema },
            ]),
            tenants_module_1.TenantsModule,
            users_module_1.UsersModule,
            bookings_module_1.BookingsModule,
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map