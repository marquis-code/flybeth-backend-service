"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentTenant = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentTenant = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request.user?.tenant;
    return data ? tenant?.[data] : tenant;
});
//# sourceMappingURL=current-tenant.decorator.js.map