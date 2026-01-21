import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  createReadStream: jest.fn(),
  promises: {
    writeFile: jest.fn(),
    unlink: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('StorageService', () => {
  let service: StorageService;
  let configService: jest.Mocked<ConfigService>;

  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockFsPromises = fs.promises as jest.Mocked<typeof fs.promises>;

  beforeEach(async () => {
    jest.clearAllMocks();

    (mockFs.existsSync as jest.Mock).mockReturnValue(true);
    (mockFs.mkdirSync as jest.Mock).mockImplementation(() => undefined);
    (mockFsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
    (mockFsPromises.unlink as jest.Mock).mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                UPLOAD_DIR: './test-uploads',
                STORAGE_BASE_URL: 'http://localhost:3000/uploads',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    configService = module.get(ConfigService);
  });

  describe('constructor', () => {
    it('should create upload directory if it does not exist', async () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(false);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => undefined),
            },
          },
        ],
      }).compile();

      expect(mockFs.mkdirSync).toHaveBeenCalled();
    });
  });

  describe('uploadFile', () => {
    const mockFile: Express.Multer.File = {
      originalname: 'test-file.pdf',
      buffer: Buffer.from('test content'),
      size: 12,
      mimetype: 'application/pdf',
      fieldname: 'file',
      encoding: '7bit',
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    it('should upload file and return correct result', async () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await service.uploadFile(mockFile, 'documents');

      expect(result).toEqual({
        url: 'http://localhost:3000/uploads/documents/mock-uuid-1234.pdf',
        key: 'documents/mock-uuid-1234.pdf',
        originalName: 'test-file.pdf',
        size: 12,
        mimeType: 'application/pdf',
      });
      expect(mockFsPromises.writeFile).toHaveBeenCalled();
    });

    it('should create folder if it does not exist', async () => {
      // First call is in constructor (upload dir check), second call is for folder check
      (mockFs.existsSync as jest.Mock)
        .mockReturnValueOnce(true) // Constructor check for upload dir
        .mockReturnValueOnce(false); // Check for folder during uploadFile

      // Need to recreate service to get fresh mock behavior
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config: Record<string, any> = {
                  UPLOAD_DIR: './test-uploads',
                  STORAGE_BASE_URL: 'http://localhost:3000/uploads',
                };
                return config[key];
              }),
            },
          },
        ],
      }).compile();

      const testService = module.get<StorageService>(StorageService);

      // Reset mock calls after constructor
      (mockFs.mkdirSync as jest.Mock).mockClear();

      // Set up for uploadFile call - folder doesn't exist
      (mockFs.existsSync as jest.Mock).mockReturnValue(false);

      await testService.uploadFile(mockFile, 'new-folder');

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('new-folder'),
        { recursive: true },
      );
    });

    it('should use general folder as default', async () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await service.uploadFile(mockFile);

      expect(result.key).toContain('general/');
    });
  });

  describe('uploadMultiple', () => {
    const mockFiles: Express.Multer.File[] = [
      {
        originalname: 'file1.pdf',
        buffer: Buffer.from('content1'),
        size: 8,
        mimetype: 'application/pdf',
        fieldname: 'files',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      },
      {
        originalname: 'file2.jpg',
        buffer: Buffer.from('content2'),
        size: 8,
        mimetype: 'image/jpeg',
        fieldname: 'files',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      },
    ];

    it('should upload all files and return array of results', async () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(true);

      const results = await service.uploadMultiple(mockFiles, 'batch');

      expect(results).toHaveLength(2);
      expect(results[0].originalName).toBe('file1.pdf');
      expect(results[1].originalName).toBe('file2.jpg');
    });
  });

  describe('deleteFile', () => {
    it('should delete file and return true', async () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(true);
      (mockFsPromises.unlink as jest.Mock).mockResolvedValue(undefined);

      const result = await service.deleteFile('folder/file.pdf');

      expect(result).toBe(true);
      expect(mockFsPromises.unlink).toHaveBeenCalled();
    });

    it('should return false when file does not exist', async () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await service.deleteFile('folder/nonexistent.pdf');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(true);
      (mockFsPromises.unlink as jest.Mock).mockRejectedValue(
        new Error('Permission denied'),
      );

      const result = await service.deleteFile('folder/file.pdf');

      expect(result).toBe(false);
    });
  });

  describe('getFileStream', () => {
    it('should return ReadStream for existing file', () => {
      const mockStream = { pipe: jest.fn() };
      (mockFs.existsSync as jest.Mock).mockReturnValue(true);
      (mockFs.createReadStream as jest.Mock).mockReturnValue(mockStream as any);

      const result = service.getFileStream('folder/file.pdf');

      expect(result).toBe(mockStream);
      expect(mockFs.createReadStream).toHaveBeenCalled();
    });

    it('should return null for non-existing file', () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(false);

      const result = service.getFileStream('folder/nonexistent.pdf');

      expect(result).toBeNull();
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(true);

      const result = service.fileExists('folder/file.pdf');

      expect(result).toBe(true);
    });

    it('should return false for non-existing file', () => {
      (mockFs.existsSync as jest.Mock).mockReturnValue(false);

      const result = service.fileExists('folder/nonexistent.pdf');

      expect(result).toBe(false);
    });
  });

  describe('getPublicUrl', () => {
    it('should return correct URL format', () => {
      const result = service.getPublicUrl('documents/file.pdf');

      expect(result).toBe('http://localhost:3000/uploads/documents/file.pdf');
    });
  });
});
