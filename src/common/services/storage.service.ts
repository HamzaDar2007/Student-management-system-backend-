import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
    url: string;
    key: string;
    originalName: string;
    size: number;
    mimeType: string;
}

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly uploadDir: string;
    private readonly baseUrl: string;

    constructor(private configService: ConfigService) {
        this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || './uploads';
        this.baseUrl = this.configService.get<string>('STORAGE_BASE_URL') || 'http://localhost:3000/uploads';

        // Ensure upload directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async uploadFile(
        file: Express.Multer.File,
        folder: string = 'general',
    ): Promise<UploadResult> {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        const folderPath = path.join(this.uploadDir, folder);
        const filePath = path.join(folderPath, filename);

        // Create folder if it doesn't exist
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        // Write file
        await fs.promises.writeFile(filePath, file.buffer);

        this.logger.log(`File uploaded: ${filePath}`);

        return {
            url: `${this.baseUrl}/${folder}/${filename}`,
            key: `${folder}/${filename}`,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
        };
    }

    async uploadMultiple(
        files: Express.Multer.File[],
        folder: string = 'general',
    ): Promise<UploadResult[]> {
        return Promise.all(files.map((file) => this.uploadFile(file, folder)));
    }

    async deleteFile(key: string): Promise<boolean> {
        try {
            const filePath = path.join(this.uploadDir, key);
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
                this.logger.log(`File deleted: ${filePath}`);
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error(`Failed to delete file: ${key}`, error);
            return false;
        }
    }

    async getFileStream(key: string): Promise<fs.ReadStream | null> {
        const filePath = path.join(this.uploadDir, key);
        if (fs.existsSync(filePath)) {
            return fs.createReadStream(filePath);
        }
        return null;
    }

    async fileExists(key: string): Promise<boolean> {
        const filePath = path.join(this.uploadDir, key);
        return fs.existsSync(filePath);
    }

    getPublicUrl(key: string): string {
        return `${this.baseUrl}/${key}`;
    }
}
