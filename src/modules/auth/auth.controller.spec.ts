import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { User, UserRole } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser: Partial<User> = {
    id: 1,
    email: 'test@test.com',
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    role: UserRole.STUDENT,
    is_active: true,
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
    getMe: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const dto: RegisterDto = {
        email: 'new@test.com',
        password: 'Password123!',
        username: 'newuser',
        first_name: 'New',
        last_name: 'User',
      };
      const expected = { id: 1, ...dto, password: undefined };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('should login and return tokens', async () => {
      const dto: LoginDto = {
        email: 'test@test.com',
        password: 'Password123!',
      };
      const expected = {
        access_token: 'jwt_token',
        refresh_token: 'refresh_token',
        user: mockUser,
      };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('refreshToken', () => {
    it('should refresh the access token', async () => {
      const refreshToken = 'valid_refresh_token';
      const userId = 1;
      const expected = { access_token: 'new_jwt_token' };
      mockAuthService.refreshToken.mockResolvedValue(expected);

      const result = await controller.refreshToken(refreshToken, userId);

      expect(authService.refreshToken).toHaveBeenCalledWith(
        userId,
        refreshToken,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const dto: ForgotPasswordDto = { email: 'test@test.com' };
      const expected = { message: 'Reset email sent if account exists' };
      mockAuthService.forgotPassword.mockResolvedValue(expected);

      const result = await controller.forgotPassword(dto);

      expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const dto: ResetPasswordDto = {
        token: 'valid_reset_token',
        password: 'NewPassword123!',
      };
      const expected = { message: 'Password reset successfully' };
      mockAuthService.resetPassword.mockResolvedValue(expected);

      const result = await controller.resetPassword(dto);

      expect(authService.resetPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const dto: VerifyEmailDto = { token: 'valid_verification_token' };
      const expected = { message: 'Email verified successfully' };
      mockAuthService.verifyEmail.mockResolvedValue(expected);

      const result = await controller.verifyEmail(dto);

      expect(authService.verifyEmail).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('getMe', () => {
    it('should return current user profile', async () => {
      mockAuthService.getMe.mockResolvedValue(mockUser);

      const result = await controller.getMe(mockUser as User);

      expect(authService.getMe).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should logout the current user', async () => {
      const expected = { message: 'Logged out successfully' };
      mockAuthService.logout.mockResolvedValue(expected);

      const result = await controller.logout(mockUser as User);

      expect(authService.logout).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(expected);
    });
  });
});
