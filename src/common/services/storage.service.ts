import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);

    constructor(private configService: ConfigService) { }

    async uploadFile(file: any, folder: string = 'uploads') {
        this.logger.log(`Uploading file to folder: ${folder}`);
        // implementation for local or S3 storage
        return {
            url: `https://storage.example.com/${folder}/${file.originalname}`,
            key: `${folder}/${file.originalname}`,
        };
    }

    async deleteFile(key: string) {
        this.logger.log(`Deleting file with key: ${key}`);
        return true;
    }
}
