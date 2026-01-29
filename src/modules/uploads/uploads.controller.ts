import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StorageService } from '../../common/services/storage.service';
import {
  UploadFileDto,
  UploadResponseDto,
  MultipleUploadResponseDto,
  DeleteFileResponseDto,
} from './dto';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_FILE_TYPES =
  /^(image\/(jpeg|png|gif|webp)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)|text\/plain)$/;

@ApiTags('Uploads')
@ApiBearerAuth('JWT-auth')
@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (max 10MB)',
        },
        folder: {
          type: 'string',
          description: 'Folder to store file in',
          example: 'documents',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Teacher only',
  })
  async uploadFile(
    @UploadedFile()
    file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Manual validation since file type and size validation is handled manually below
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File ${file.originalname} exceeds maximum size of 10MB`,
      );
    }

    if (!ALLOWED_FILE_TYPES.test(file.mimetype)) {
      throw new BadRequestException(
        `File ${file.originalname} has invalid type: ${file.mimetype}`,
      );
    }

    const result = await this.storageService.uploadFile(
      file,
      dto.folder || 'general',
    );

    return {
      message: 'File uploaded successfully',
      file: result,
    };
  }

  @Post('multiple')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload multiple files (max 10)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Files to upload (max 10 files, 10MB each)',
        },
        folder: {
          type: 'string',
          description: 'Folder to store files in',
          example: 'documents',
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
    type: MultipleUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin or Teacher only',
  })
  async uploadMultipleFiles(
    @UploadedFiles()
    files: Express.Multer.File[],
    @Body() dto: UploadFileDto,
  ): Promise<MultipleUploadResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Validate each file
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException(
          `File ${file.originalname} exceeds maximum size of 10MB`,
        );
      }
      if (!ALLOWED_FILE_TYPES.test(file.mimetype)) {
        throw new BadRequestException(
          `File ${file.originalname} has invalid type: ${file.mimetype}`,
        );
      }
    }

    const results = await this.storageService.uploadMultiple(
      files,
      dto.folder || 'general',
    );

    return {
      message: `${results.length} file(s) uploaded successfully`,
      files: results,
      count: results.length,
    };
  }

  @Post(':folder')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a single file to a specific folder' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'folder', description: 'Folder to store file in' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (max 10MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: UploadResponseDto,
  })
  async uploadToFolder(
    @UploadedFile()
    file: Express.Multer.File,
    @Param('folder') folder: string,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File ${file.originalname} exceeds maximum size of 10MB`,
      );
    }

    if (!ALLOWED_FILE_TYPES.test(file.mimetype)) {
      throw new BadRequestException(
        `File ${file.originalname} has invalid type: ${file.mimetype}`,
      );
    }

    const result = await this.storageService.uploadFile(file, folder);

    return {
      message: 'File uploaded successfully',
      file: result,
    };
  }

  @Get(':folder/:filename')
  @ApiOperation({ summary: 'Download/view a file' })
  @ApiParam({ name: 'folder', description: 'Folder name' })
  @ApiParam({ name: 'filename', description: 'Filename' })
  @ApiResponse({ status: 200, description: 'File stream' })
  @ApiResponse({ status: 404, description: 'File not found' })
  getFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ): void {
    const key = `${folder}/${filename}`;
    const stream = this.storageService.getFileStream(key);

    if (!stream) {
      throw new NotFoundException('File not found');
    }

    // Set content type based on file extension
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
    };

    const contentType = mimeTypes[ext || ''] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    stream.pipe(res);
  }

  @Delete(':folder/:filename')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a file (Admin only)' })
  @ApiParam({ name: 'folder', description: 'Folder name' })
  @ApiParam({ name: 'filename', description: 'Filename' })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    type: DeleteFileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async deleteFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
  ): Promise<DeleteFileResponseDto> {
    const key = `${folder}/${filename}`;

    if (!this.storageService.fileExists(key)) {
      throw new NotFoundException('File not found');
    }

    const deleted = await this.storageService.deleteFile(key);

    return {
      message: deleted ? 'File deleted successfully' : 'Failed to delete file',
      deleted,
    };
  }

  @Get('exists/:folder/:filename')
  @ApiOperation({ summary: 'Check if a file exists' })
  @ApiParam({ name: 'folder', description: 'Folder name' })
  @ApiParam({ name: 'filename', description: 'Filename' })
  @ApiResponse({
    status: 200,
    description: 'Returns whether file exists',
    schema: {
      type: 'object',
      properties: {
        exists: { type: 'boolean' },
        url: { type: 'string', nullable: true },
      },
    },
  })
  checkFileExists(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
  ): { exists: boolean; url: string | null } {
    const key = `${folder}/${filename}`;
    const exists = this.storageService.fileExists(key);

    return {
      exists,
      url: exists ? this.storageService.getPublicUrl(key) : null,
    };
  }
}
