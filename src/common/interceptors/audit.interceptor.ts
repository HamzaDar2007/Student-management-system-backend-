import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';

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
    const request = context.switchToHttp().getRequest();
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
        next: (data) => {
          // Log successful operations
          this.auditService.log({
            user_id: user?.id,
            action,
            resource: resource.charAt(0).toUpperCase() + resource.slice(1),
            resource_id: resourceId || data?.id?.toString(),
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
    const match = url.match(/\/api\/([^\/\?]+)/);
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

  private sanitizePayload(body: any): any {
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
