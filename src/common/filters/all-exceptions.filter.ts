// src/common/filters/all-exceptions.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { I18nService } from 'nestjs-i18n';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly i18n: I18nService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const lang = request.headers['accept-language'] || 'en';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Internal server error";
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === "object") {
        const resp = exceptionResponse as any;
        message = resp.message || exception.message;
        errors = resp.errors || null;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    // Translate message if it's a string, or map over array
    if (this.i18n) {
      if (typeof message === 'string') {
        try {
          const key = `common.errors.${message.toUpperCase().replace(/\s+/g, '_')}`;
          const translated = await this.i18n.translate(key, { lang });
          if (translated !== key) {
            message = translated as string;
          }
        } catch { /* ignore */ }
      } else if (Array.isArray(message)) {
        message = (await Promise.all(message.map(async (msg: string) => {
          try {
             return (await this.i18n.translate(msg, { lang })) || msg;
          } catch { return msg; }
        }))) as string[];
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message,
      errors: Array.isArray(message) ? message : errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
