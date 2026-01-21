import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let configService: jest.Mocked<ConfigService>;
  let mockTransporter: any;

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn(),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                SMTP_HOST: 'smtp.test.com',
                SMTP_PORT: 587,
                SMTP_USER: 'testuser',
                SMTP_PASS: 'testpass',
                MAIL_FROM: 'test@example.com',
                FRONTEND_URL: 'http://localhost:4200',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create transporter with config values', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'testuser',
          pass: 'testpass',
        },
      });
    });
  });

  describe('sendMail', () => {
    it('should send email with correct parameters', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      const result = await service.sendMail(
        'recipient@test.com',
        'Test Subject',
        '<p>Test</p>',
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'recipient@test.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
      });
      expect(result).toBe(true);
    });

    it('should return false on failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const result = await service.sendMail(
        'recipient@test.com',
        'Test Subject',
        '<p>Test</p>',
      );

      expect(result).toBe(false);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with user firstName', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'welcome-id' });
      const user = {
        email: 'user@test.com',
        firstName: 'John',
        username: 'johndoe',
      };

      await service.sendWelcomeEmail(user);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: 'Welcome to Student Management System',
          html: expect.stringContaining('Hello John'),
        }),
      );
    });

    it('should fallback to username when firstName is missing', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'welcome-id' });
      const user = { email: 'user@test.com', username: 'johndoe' };

      await service.sendWelcomeEmail(user);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Hello johndoe'),
        }),
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct URL', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'reset-id' });
      const user = {
        email: 'user@test.com',
        firstName: 'John',
        username: 'johndoe',
      };
      const token = 'reset-token-123';

      await service.sendPasswordResetEmail(user, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: 'Password Reset Request',
          html: expect.stringContaining(
            'http://localhost:4200/auth/reset-password?token=reset-token-123',
          ),
        }),
      );
    });

    it('should include user name in email', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'reset-id' });
      const user = {
        email: 'user@test.com',
        firstName: 'Jane',
        username: 'janedoe',
      };

      await service.sendPasswordResetEmail(user, 'token');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Hello Jane'),
        }),
      );
    });
  });

  describe('sendEmailVerification', () => {
    it('should send verification email with correct URL', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'verify-id' });
      const user = {
        email: 'user@test.com',
        firstName: 'John',
        username: 'johndoe',
      };
      const token = 'verify-token-456';

      await service.sendEmailVerification(user, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: 'Verify Your Email',
          html: expect.stringContaining(
            'http://localhost:4200/auth/verify-email?token=verify-token-456',
          ),
        }),
      );
    });

    it('should include user name in verification email', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'verify-id' });
      const user = {
        email: 'user@test.com',
        firstName: 'Bob',
        username: 'bobsmith',
      };

      await service.sendEmailVerification(user, 'token');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Hello Bob'),
        }),
      );
    });
  });
});
