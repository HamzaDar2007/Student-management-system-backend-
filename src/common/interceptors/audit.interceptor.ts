import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';
import { User } from '../../modules/users/entities/user.entity';

interface RequestWithUser {
  user?: User;
  method: string;
  url: string;
  body: Record<string, unknown> | null;
  params: Record<string, string>;
}

const AUDITED_RESOURCES = [
  'students',
  'grades',
  'enrollments',
  'users',
  'courses',
];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { method, url, body, params, user } = request;

    // Only audit specific HTTP methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Extract resource from URL
    const resource = this.extractResource(url);
    if (!resource || !AUDITED_RESOURCES.includes(resource.toLowerCase())) {
      return next.handle();
    }

    const action = this.methodToAction(method);
    const resourceId = params.id || null;

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          // Log successful operations
          void this.auditService.log({
            userId: user?.id,
            action,
            resource: resource.charAt(0).toUpperCase() + resource.slice(1),
            resourceId:
              resourceId || (data as { id?: unknown })?.id?.toString(),
            payload: this.sanitizePayload(body),
          });
        },
        error: () => {
          // Optionally log failed operations
        },
      }),
    );
  }

  private extractResource(url: string): string | null {
    const match = url.match(/\/api\/([^/?]+)/);
    return match ? match[1] : null;
  }

  private methodToAction(method: string): string {
    const map: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return map[method] || method;
  }

  private sanitizePayload(
    body: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!body) return null;
    const sanitized = { ...body };
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.passwordHash;
    delete sanitized.refresh_token;
    delete sanitized.token;
    return sanitized;
  }
}
