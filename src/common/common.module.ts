import { Module, Global } from '@nestjs/common';
import { MailService } from './services/mail.service';
import { StorageService } from './services/storage.service';
import { CacheService } from './services/cache.service';

@Global()
@Module({
  providers: [MailService, StorageService, CacheService],
  exports: [MailService, StorageService, CacheService],
})
export class CommonModule {}
