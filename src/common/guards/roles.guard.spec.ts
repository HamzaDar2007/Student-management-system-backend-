import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../modules/users/entities/user.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockExecutionContext = (user?: { role?: UserRole }): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = mockExecutionContext({ role: UserRole.STUDENT });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should return true when required roles is empty array', () => {
      reflector.getAllAndOverride.mockReturnValue([]);
      const context = mockExecutionContext({ role: UserRole.STUDENT });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user has one of the required roles', () => {
      reflector.getAllAndOverride.mockReturnValue([
        UserRole.ADMIN,
        UserRole.TEACHER,
      ]);
      const context = mockExecutionContext({ role: UserRole.ADMIN });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user role matches single required role', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.STUDENT]);
      const context = mockExecutionContext({ role: UserRole.STUDENT });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return false when user role does not match any required role', () => {
      reflector.getAllAndOverride.mockReturnValue([
        UserRole.ADMIN,
        UserRole.TEACHER,
      ]);
      const context = mockExecutionContext({ role: UserRole.STUDENT });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user has no role', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = mockExecutionContext({ role: undefined });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when no user on request', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = mockExecutionContext(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user is null', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: null }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
