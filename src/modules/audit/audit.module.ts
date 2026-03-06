// src/modules/audit/audit.module.ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuditLog, AuditLogSchema } from "./schemas/audit-log.schema";
import { AuditInterceptor } from "./audit.interceptor";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  providers: [AuditInterceptor],
  exports: [AuditInterceptor, MongooseModule],
})
export class AuditModule {}
