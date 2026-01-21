import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;
}

export const SKIP_TRANSFORM_KEY = 'skipTransform';

/**
 * Interceptor that transforms all API responses to a standardized format.
 * Use @SkipTransform() decorator to skip transformation for specific endpoints.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | T
> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | T> {
    // Check if transformation should be skipped
    const skipTransform = this.reflector.getAllAndOverride<boolean>(
      SKIP_TRANSFORM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipTransform) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data): ApiResponse<T> => {
        // Handle paginated responses
        if (this.isPaginatedResponse(data)) {
          return {
            success: true,
            data: data.data as T,
            meta: {
              page: data.page,
              limit: data.limit,
              total: data.total,
              totalPages: Math.ceil(data.total / data.limit),
            },
            timestamp: new Date().toISOString(),
          };
        }

        // Handle regular responses
        return {
          success: true,
          data: data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  private isPaginatedResponse(data: unknown): data is {
    data: unknown[];
    page: number;
    limit: number;
    total: number;
  } {
    return (
      data !== null &&
      typeof data === 'object' &&
      'data' in data &&
      'page' in data &&
      'limit' in data &&
      'total' in data
    );
  }
}
