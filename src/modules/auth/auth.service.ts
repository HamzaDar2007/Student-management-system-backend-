import {
  BadRequestException,
  ConflictException,
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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) { }

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (existing) throw new ConflictException('Email or username already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepo.save(
      this.userRepo.create({
        email: dto.email,
        username: dto.username,
        passwordHash,
        role: dto.role || UserRole.STUDENT,
        firstName: dto.first_name ?? null,
        lastName: dto.last_name ?? null,
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

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account disabled');

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

  async refreshToken(userId: number, refreshToken: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Access Denied');

    const tokensMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokensMatch) throw new UnauthorizedException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async getTokens(userId: number, email: string, role: string) {
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
      return { message: 'If account exists, password reset email has been sent' };
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
        const isValid = await bcrypt.compare(dto.token, user.passwordResetToken);
        if (isValid && user.passwordResetExpires && user.passwordResetExpires > new Date()) {
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

  async getMe(userId: number) {
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

  async logout(userId: number) {
    await this.userRepo.update(userId, { refreshToken: null });
    return { message: 'Logged out successfully' };
  }
}
