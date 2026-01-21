import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from '../../modules/audit/audit.service';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let auditService: jest.Mocked<AuditService>;

  const mockCallHandler: CallHandler = {
    handle: () => of({ id: 123 }),
  };

  const createMockContext = (
    method: string,
    url: string,
    body: any = {},
    params: any = {},
    user: any = { id: 1 },
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          url,
          body,
          params,
          user,
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    auditService = {
      log: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<AuditService>;

    interceptor = new AuditInterceptor(auditService);
  });

  describe('intercept', () => {
    it('should not audit GET requests', (done) => {
      const context = createMockContext('GET', '/api/students');

      interceptor.intercept(context, mockCallHandler).subscribe({
        complete: () => {
          expect(auditService.log).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should not audit non-audited resources', (done) => {
      const context = createMockContext('POST', '/api/health');

      interceptor.intercept(context, mockCallHandler).subscribe({
        complete: () => {
          expect(auditService.log).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should audit POST requests on students resource', (done) => {
      const context = createMockContext('POST', '/api/students', {
        name: 'John',
      });

      interceptor.intercept(context, mockCallHandler).subscribe({
        complete: () => {
          expect(auditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
              action: 'CREATE',
              resource: 'Students',
              user_id: 1,
            }),
          );
          done();
        },
      });
    });

    it('should audit PUT requests with UPDATE action', (done) => {
      const context = createMockContext(
        'PUT',
        '/api/students/1',
        { name: 'Updated' },
        { id: '1' },
      );

      interceptor.intercept(context, mockCallHandler).subscribe({
        complete: () => {
          expect(auditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
              action: 'UPDATE',
              resource: 'Students',
              resource_id: '1',
            }),
          );
          done();
        },
      });
    });

    it('should audit PATCH requests with UPDATE action', (done) => {
      const context = createMockContext(
        'PATCH',
        '/api/grades/5',
        { score: 90 },
        { id: '5' },
      );

      interceptor.intercept(context, mockCallHandler).subscribe({
        complete: () => {
          expect(auditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
              action: 'UPDATE',
              resource: 'Grades',
            }),
          );
          done();
        },
      });
    });

    it('should audit DELETE requests with DELETE action', (done) => {
      const context = createMockContext(
        'DELETE',
        '/api/enrollments/10',
        {},
        { id: '10' },
      );

      interceptor.intercept(context, mockCallHandler).subscribe({
        complete: () => {
          expect(auditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
              action: 'DELETE',
              resource: 'Enrollments',
              resource_id: '10',
            }),
          );
          done();
        },
      });
    });

    it('should audit users resource', (done) => {
      const context = createMockContext('POST', '/api/users', {
        email: 'test@example.com',
      });

      interceptor.intercept(context, mockCallHandler).subscribe({
        complete: () => {
          expect(auditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
              resource: 'Users',
            }),
          );
          done();
        },
      });
    });

    it('should audit courses resource', (done) => {
      const context = createMockContext('POST', '/api/courses', {
        name: 'Math 101',
      });

      interceptor.intercept(context, mockCallHandler).subscribe({
        complete: () => {
          expect(auditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
              resource: 'Courses',
            }),
          );
          done();
        },
      });
    });

    it('should sanitize payload by removing password', (done) => {
      const context = createMockContext('POST', '/api/users', {
        email: 'test@example.com',
        password: 'secret123',
      });

      interceptor.intercept(context, mockCallHandler).subscribe({
        complete: () => {
          const logCall = auditService.log.mock.calls[0][0];
          expect(logCall.payload).not.toHaveProperty('password');
          expect(logCall.payload?.email).toBe('test@example.com');
          done();
        },
      });
    });

    it('should sanitize payload by removing passwordHash', (done) => {
      const context = createMockContext('POST', '/api/users', {
        email: 'test@example.com',
        passwordHash: 'hashedValue',
      });

      interceptor.intercept(context, mockCallHandler).subscribe({
        complete: () => {
          const logCall = auditService.log.mock.calls[0][0];
          expect(logCall.payload).not.toHaveProperty('passwordHash');
          done();
        },
      });
    });

    it('should sanitize payload by removing refresh_token', (done) => {
      const context = createMockContext('POST', '/api/users', {
        email: 'test@example.com',
        refresh_token: 'tokenValue',
      });

      interceptor.intercept(context, mockCallHandler).subscribe({
        complete: () => {
          const logCall = auditService.log.mock.calls[0][0];
          expect(logCall.payload).not.toHaveProperty('refresh_token');
          done();
        },
      });
    });

    it('should sanitize payload by removing token', (done) => {
      const context = createMockContext('POST', '/api/users', {
        email: 'test@example.com',
        token: 'someToken',
      });

      interceptor.intercept(context, mockCallHandler).subscribe({
        complete: () => {
          const logCall = auditService.log.mock.calls[0][0];
          expect(logCall.payload).not.toHaveProperty('token');
          done();
        },
      });
    });

    it('should use response id as resource_id when no params.id', (done) => {
      const context = createMockContext(
        'POST',
        '/api/students',
        { name: 'New Student' },
        {},
      );

      interceptor.intercept(context, mockCallHandler).subscribe({
        complete: () => {
          expect(auditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
              resource_id: '123',
            }),
          );
          done();
        },
      });
    });

    it('should handle null body in sanitization', (done) => {
      const context = createMockContext('DELETE', '/api/students/1', null, {
        id: '1',
      });

      interceptor.intercept(context, mockCallHandler).subscribe({
        complete: () => {
          const logCall = auditService.log.mock.calls[0][0];
          expect(logCall.payload).toBeNull();
          done();
        },
      });
    });

    it('should handle missing user on request (user?.id returns undefined)', (done) => {
      // When user is undefined, user?.id evaluates to undefined
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/api/students',
            body: { name: 'Test' },
            params: {},
            user: undefined,
          }),
        }),
      } as unknown as ExecutionContext;

      interceptor.intercept(context, mockCallHandler).subscribe({
        complete: () => {
          expect(auditService.log).toHaveBeenCalledWith(
            expect.objectContaining({
              user_id: undefined,
            }),
          );
          done();
        },
      });
    });
  });
});
