// src/common/filters/all-exceptions.filter.ts
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errors: any = null;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
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
