import { Module, Global } from '@nestjs/common';
import { MailService } from './services/mail.service';
import { StorageService } from './services/storage.service';

@Global()
@Module({
    providers: [MailService, StorageService],
    exports: [MailService, StorageService],
})
export class CommonModule { }
