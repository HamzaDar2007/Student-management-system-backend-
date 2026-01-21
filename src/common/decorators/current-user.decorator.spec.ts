import 'reflect-metadata';
import { CurrentUser } from './current-user.decorator';
import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

describe('CurrentUser Decorator', () => {
  it('should be defined', () => {
    expect(CurrentUser).toBeDefined();
  });

  it('should be a function that creates a param decorator', () => {
    expect(typeof CurrentUser).toBe('function');
  });

  describe('Decorator Metadata', () => {
    it('should set parameter decorator metadata on a method parameter', () => {
      class TestController {
        testMethod(@CurrentUser() user: any) {
          return user;
        }
      }

      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        TestController,
        'testMethod',
      );

      expect(metadata).toBeDefined();
      // Metadata structure contains factory function for custom decorator
      const keys = Object.keys(metadata);
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should work with multiple parameters', () => {
      class TestController {
        testMethod(@CurrentUser() user: any, otherParam: string) {
          return { user, otherParam };
        }
      }

      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        TestController,
        'testMethod',
      );

      expect(metadata).toBeDefined();
    });

    it('should work on different methods independently', () => {
      class TestController {
        method1(@CurrentUser() user: any) {
          return user;
        }

        method2(@CurrentUser() user: any) {
          return user;
        }
      }

      const metadata1 = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        TestController,
        'method1',
      );
      const metadata2 = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        TestController,
        'method2',
      );

      expect(metadata1).toBeDefined();
      expect(metadata2).toBeDefined();
    });
  });

  describe('Decorator Factory Function', () => {
    const mockExecutionContext = (user: any): ExecutionContext => {
      return {
        switchToHttp: () => ({
          getRequest: () => ({ user }),
          getResponse: () => ({}),
          getNext: () => jest.fn(),
        }),
        getType: () => 'http',
        getClass: () => class {},
        getHandler: () => jest.fn(),
        getArgs: () => [],
        getArgByIndex: (index: number) => undefined,
        switchToRpc: () => ({}) as any,
        switchToWs: () => ({}) as any,
      } as ExecutionContext;
    };

    it('should extract user from request object', () => {
      const testUser = {
        id: 1,
        email: 'test@example.com',
        role: 'admin',
      };

      class TestController {
        testMethod(@CurrentUser() user: any) {
          return user;
        }
      }

      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        TestController,
        'testMethod',
      );

      // Get the factory function from metadata
      const key = Object.keys(metadata)[0];
      const factory = metadata[key].factory;

      // Call factory with mock context
      const ctx = mockExecutionContext(testUser);
      const result = factory(null, ctx);

      expect(result).toEqual(testUser);
    });

    it('should return undefined when user is not set in request', () => {
      class TestController {
        testMethod(@CurrentUser() user: any) {
          return user;
        }
      }

      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        TestController,
        'testMethod',
      );

      const key = Object.keys(metadata)[0];
      const factory = metadata[key].factory;

      const ctx = mockExecutionContext(undefined);
      const result = factory(null, ctx);

      expect(result).toBeUndefined();
    });

    it('should return null when user is explicitly null', () => {
      class TestController {
        testMethod(@CurrentUser() user: any) {
          return user;
        }
      }

      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        TestController,
        'testMethod',
      );

      const key = Object.keys(metadata)[0];
      const factory = metadata[key].factory;

      const ctx = mockExecutionContext(null);
      const result = factory(null, ctx);

      expect(result).toBeNull();
    });

    it('should extract user with complex properties', () => {
      const complexUser = {
        id: 123,
        email: 'complex@example.com',
        role: 'teacher',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          avatar: 'https://example.com/avatar.png',
        },
        permissions: ['read', 'write', 'delete'],
        metadata: {
          lastLogin: new Date('2024-01-01'),
          loginCount: 42,
        },
      };

      class TestController {
        testMethod(@CurrentUser() user: any) {
          return user;
        }
      }

      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        TestController,
        'testMethod',
      );

      const key = Object.keys(metadata)[0];
      const factory = metadata[key].factory;

      const ctx = mockExecutionContext(complexUser);
      const result = factory(null, ctx);

      expect(result).toEqual(complexUser);
      expect(result.profile).toEqual(complexUser.profile);
      expect(result.permissions).toEqual(complexUser.permissions);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty user object', () => {
      class TestController {
        testMethod(@CurrentUser() user: any) {
          return user;
        }
      }

      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        TestController,
        'testMethod',
      );

      const key = Object.keys(metadata)[0];
      const factory = metadata[key].factory;

      const mockCtx = {
        switchToHttp: () => ({
          getRequest: () => ({ user: {} }),
        }),
      } as ExecutionContext;

      const result = factory(null, mockCtx);
      expect(result).toEqual({});
    });

    it('should work with typed user interface', () => {
      interface User {
        id: number;
        email: string;
        role: string;
      }

      class TestController {
        testMethod(@CurrentUser() user: User) {
          return user;
        }
      }

      // Decorator should compile and work with typed interface
      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        TestController,
        'testMethod',
      );

      expect(metadata).toBeDefined();
    });
  });
});
