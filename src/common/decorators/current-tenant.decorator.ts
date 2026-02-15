// src/common/decorators/current-tenant.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const tenant = request.user?.tenant;
        return data ? tenant?.[data] : tenant;
    },
);
