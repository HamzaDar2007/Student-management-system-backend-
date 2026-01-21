import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import {
  TransformInterceptor,
  SKIP_TRANSFORM_KEY,
} from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;
  let reflector: jest.Mocked<Reflector>;

  const mockCallHandler: CallHandler = {
    handle: () => of({ id: 1, name: 'Test' }),
  };

  const mockExecutionContext = (): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    interceptor = new TransformInterceptor(reflector);
  });

  describe('intercept', () => {
    it('should transform regular response to standard format', (done) => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = mockExecutionContext();

      interceptor.intercept(context, mockCallHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: { id: 1, name: 'Test' },
          timestamp: expect.any(String),
        });
        done();
      });
    });

    it('should include meta for paginated responses', (done) => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = mockExecutionContext();
      const paginatedHandler: CallHandler = {
        handle: () =>
          of({
            data: [{ id: 1 }, { id: 2 }],
            page: 1,
            limit: 10,
            total: 25,
          }),
      };

      interceptor.intercept(context, paginatedHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: [{ id: 1 }, { id: 2 }],
          meta: {
            page: 1,
            limit: 10,
            total: 25,
            totalPages: 3,
          },
          timestamp: expect.any(String),
        });
        done();
      });
    });

    it('should skip transformation when SkipTransform decorator is used', (done) => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const context = mockExecutionContext();

      interceptor.intercept(context, mockCallHandler).subscribe((result) => {
        expect(result).toEqual({ id: 1, name: 'Test' });
        done();
      });
    });

    it('should call reflector with correct key', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = mockExecutionContext();

      interceptor.intercept(context, mockCallHandler).subscribe();

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        SKIP_TRANSFORM_KEY,
        [context.getHandler(), context.getClass()],
      );
    });

    it('should handle null data', (done) => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = mockExecutionContext();
      const nullHandler: CallHandler = {
        handle: () => of(null),
      };

      interceptor.intercept(context, nullHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: null,
          timestamp: expect.any(String),
        });
        done();
      });
    });

    it('should handle array data', (done) => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = mockExecutionContext();
      const arrayHandler: CallHandler = {
        handle: () => of([{ id: 1 }, { id: 2 }]),
      };

      interceptor.intercept(context, arrayHandler).subscribe((result) => {
        expect(result).toEqual({
          success: true,
          data: [{ id: 1 }, { id: 2 }],
          timestamp: expect.any(String),
        });
        done();
      });
    });
  });
});
