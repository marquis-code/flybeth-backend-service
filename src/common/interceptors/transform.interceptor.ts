// src/common/interceptors/transform.interceptor.ts
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    timestamp: string;
    meta?: any;
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, ApiResponse<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<ApiResponse<T>> {
        return next.handle().pipe(
            map((responseData) => {
                // If the response already has a success property, pass through
                if (responseData?.success !== undefined) {
                    return responseData;
                }

                // Extract data and meta if response is paginated
                const data = responseData?.data ?? responseData;
                const meta = responseData?.meta ?? undefined;
                const message = responseData?.message ?? 'Success';

                return {
                    success: true,
                    data,
                    message,
                    timestamp: new Date().toISOString(),
                    ...(meta && { meta }),
                };
            }),
        );
    }
}
