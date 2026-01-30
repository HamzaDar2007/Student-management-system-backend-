import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface UserLike {
  email: string;
  firstName?: string | null;
  username: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host:
        this.configService.get<string>('SMTP_HOST') || 'smtp.ethereal.email',
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from:
          this.configService.get<string>('MAIL_FROM') ||
          '"Student Management" <noreply@example.com>',
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      return false;
    }
  }

  async sendWelcomeEmail(user: UserLike) {
    const html = `
            <h1>Welcome to Student Management System</h1>
            <p>Hello ${user.firstName || user.username},</p>
            <p>Your account has been created successfully.</p>
        `;
    return this.sendMail(
      user.email,
      'Welcome to Student Management System',
      html,
    );
  }

  async sendPasswordResetEmail(user: UserLike, token: string) {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200'}/auth/reset-password?token=${token}`;
    const html = `
            <h1>Password Reset Request</h1>
            <p>Hello ${user.firstName || user.username},</p>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>This link expires in 1 hour.</p>
            <p>If you did not request this, please ignore this email.</p>
        `;
    return this.sendMail(user.email, 'Password Reset Request', html);
  }

  async sendEmailVerification(user: UserLike, token: string) {
    const verifyUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200'}/auth/verify-email?token=${token}`;
    const html = `
            <h1>Verify Your Email</h1>
            <p>Hello ${user.firstName || user.username},</p>
            <p>Please verify your email by clicking the link below:</p>
            <a href="${verifyUrl}">${verifyUrl}</a>
        `;
    return this.sendMail(user.email, 'Verify Your Email', html);
  }
}
