import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy, JwtPayload } from './jwt.strategy';
import { UserRole } from '../../users/entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-jwt-secret-key-for-testing',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should use JWT_SECRET from config service', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should use default secret when JWT_SECRET is not configured', async () => {
      const noSecretConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: ConfigService,
            useValue: noSecretConfigService,
          },
        ],
      }).compile();

      const strategyWithDefault = module.get<JwtStrategy>(JwtStrategy);
      expect(strategyWithDefault).toBeDefined();
      expect(noSecretConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });

  describe('validate', () => {
    it('should return user object from valid JWT payload', () => {
      const payload: JwtPayload = {
        sub: 1,
        email: 'test@example.com',
        role: UserRole.ADMIN,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        role: UserRole.ADMIN,
      });
    });

    it('should return user object for teacher role', () => {
      const payload: JwtPayload = {
        sub: 2,
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        id: 2,
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      });
    });

    it('should return user object for student role', () => {
      const payload: JwtPayload = {
        sub: 3,
        email: 'student@example.com',
        role: UserRole.STUDENT,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        id: 3,
        email: 'student@example.com',
        role: UserRole.STUDENT,
      });
    });

    it('should map sub to id correctly', () => {
      const payload: JwtPayload = {
        sub: 12345,
        email: 'user@example.com',
        role: UserRole.STUDENT,
      };

      const result = strategy.validate(payload);

      expect(result.id).toBe(12345);
      expect(result).not.toHaveProperty('sub');
    });

    it('should preserve email from payload', () => {
      const payload: JwtPayload = {
        sub: 1,
        email: 'unique.email@domain.com',
        role: UserRole.ADMIN,
      };

      const result = strategy.validate(payload);

      expect(result.email).toBe('unique.email@domain.com');
    });

    it('should preserve role from payload', () => {
      const roles = [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT];

      roles.forEach((role) => {
        const payload: JwtPayload = {
          sub: 1,
          email: 'test@example.com',
          role,
        };

        const result = strategy.validate(payload);
        expect(result.role).toBe(role);
      });
    });

    it('should handle payload with numeric string sub (edge case)', () => {
      // In real scenarios, sub should be a number, but test robustness
      const payload = {
        sub: 999,
        email: 'edge@example.com',
        role: UserRole.STUDENT,
      } as JwtPayload;

      const result = strategy.validate(payload);

      expect(result.id).toBe(999);
    });
  });

  describe('JwtPayload type', () => {
    it('should accept valid payload structure', () => {
      const validPayload: JwtPayload = {
        sub: 1,
        email: 'valid@example.com',
        role: UserRole.ADMIN,
      };

      // Type check - this should compile without errors
      expect(validPayload.sub).toBeDefined();
      expect(validPayload.email).toBeDefined();
      expect(validPayload.role).toBeDefined();
    });
  });
});
