// src/modules/audit/audit.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AuditLog, AuditLogDocument } from "./schemas/audit-log.schema";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, ip, user } = request;

    // Only log non-GET requests for admin/staff to avoid bloat
    // Or specific sensitive paths
    const isSensitive =
      method !== "GET" || url.includes("/admin") || url.includes("/staff");

    if (!isSensitive || !user) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (val) => {
          const duration = Date.now() - startTime;
          const statusCode = context.switchToHttp().getResponse().statusCode;

          this.auditLogModel
            .create({
              user: new Types.ObjectId(user.sub),
              method,
              url,
              body: method !== "GET" ? body : undefined,
              query,
              ip,
              statusCode,
              duration,
            })
            .catch((err) =>
              this.logger.error(`Audit logging failed: ${err.message}`),
            );
        },
      }),
    );
  }
}
