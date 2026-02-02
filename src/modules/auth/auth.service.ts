import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';

import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { MailService } from '../../common/services/mail.service';

// Account lockout configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const FAILED_ATTEMPT_RESET_MINUTES = 30;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    // Auto-generate username from email if not provided
    const username = dto.username || this.generateUsernameFromEmail(dto.email);

    const existing = await this.userRepo.findOne({
      where: [{ email: dto.email }, { username }],
    });
    if (existing) throw new ConflictException('Email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepo.save(
      this.userRepo.create({
        email: dto.email,
        username,
        passwordHash,
        role: dto.role || UserRole.STUDENT,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
        isActive: true,
      }),
    );

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  /**
   * Generate a unique username from email address
   * e.g., john.doe@example.com -> john_doe
   */
  private generateUsernameFromEmail(email: string): string {
    const localPart = email.split('@')[0];
    // Replace dots and special chars with underscores, keep only alphanumeric and underscores
    let username = localPart.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.floor(Math.random() * 10000);
    username = `${username}_${randomSuffix}`;
    return username.substring(0, 50); // Limit to 50 chars
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new ForbiddenException(
        `Account is locked. Try again in ${remainingMinutes} minute(s).`,
      );
    }

    // Reset failed attempts if lockout has expired or enough time has passed
    if (
      user.failedLoginAttempts > 0 &&
      user.lastFailedLogin &&
      new Date().getTime() - user.lastFailedLogin.getTime() >
        FAILED_ATTEMPT_RESET_MINUTES * 60 * 1000
    ) {
      await this.userRepo.update(user.id, {
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
      user.failedLoginAttempts = 0;
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      // Increment failed login attempts
      const newFailedAttempts = user.failedLoginAttempts + 1;
      const updateData: Partial<User> = {
        failedLoginAttempts: newFailedAttempts,
        lastFailedLogin: new Date(),
      };

      // Lock account if max attempts reached
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        updateData.lockedUntil = new Date(
          Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
        );
      }

      await this.userRepo.update(user.id, updateData);

      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        throw new ForbiddenException(
          `Account locked due to too many failed attempts. Try again in ${LOCKOUT_DURATION_MINUTES} minutes.`,
        );
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) throw new UnauthorizedException('Account disabled');

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await this.userRepo.update(user.id, {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastFailedLogin: null,
      });
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Access Denied');

    const tokensMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokensMatch) throw new UnauthorizedException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async getTokens(userId: string, email: string, role: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        { expiresIn: '24h' },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role },
        { expiresIn: '7d' },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      // Return success even if user not found (security best practice)
      return {
        message: 'If account exists, password reset email has been sent',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    await this.userRepo.update(user.id, {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour
    });

    await this.mailService.sendPasswordResetEmail(user, resetToken);

    return { message: 'If account exists, password reset email has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const users = await this.userRepo.find({
      where: { passwordResetToken: Not(IsNull()) },
    });

    let validUser: User | null = null;
    for (const user of users) {
      if (user.passwordResetToken) {
        const isValid = await bcrypt.compare(
          dto.token,
          user.passwordResetToken,
        );
        if (
          isValid &&
          user.passwordResetExpires &&
          user.passwordResetExpires > new Date()
        ) {
          validUser = user;
          break;
        }
      }
    }

    if (!validUser) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.new_password, 10);

    await this.userRepo.update(validUser.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    return { message: 'Password has been reset successfully' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.userRepo.findOne({
      where: { emailVerificationToken: dto.token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.userRepo.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
    });

    return { message: 'Email verified successfully' };
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['studentProfile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      studentProfile: user.studentProfile ?? null,
    };
  }

  async logout(userId: string) {
    await this.userRepo.update(userId, { refreshToken: null });
    return { message: 'Logged out successfully' };
  }
}
