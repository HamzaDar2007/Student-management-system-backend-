import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private configService: ConfigService) { }

    async sendMail(to: string, subject: string, template: string, context: any) {
        this.logger.log(`Sending email to ${to} with subject: ${subject}`);
        // implementation using nodemailer or other provider
        return true;
    }

    async sendWelcomeEmail(user: any) {
        return this.sendMail(
            user.email,
            'Welcome to Student Management System',
            'welcome',
            { name: user.firstName },
        );
    }
}
