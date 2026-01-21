import { Test, TestingModule } from '@nestjs/testing';
import { UploadsController } from './uploads.controller';
import { StorageService } from '../../common/services/storage.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Readable } from 'stream';
import { Response } from 'express';
import { UploadFileDto } from './dto';

describe('UploadsController', () => {
  let controller: UploadsController;
  let storageService: jest.Mocked<StorageService>;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-file.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: Buffer.from('test content'),
    size: 12,
    destination: '',
    filename: '',
    path: '',
    stream: null as unknown as Readable,
  };

  const mockStorageService = {
    uploadFile: jest.fn(),
    uploadMultiple: jest.fn(),
    deleteFile: jest.fn(),
    getFileStream: jest.fn(),
    fileExists: jest.fn(),
    getPublicUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
    storageService = module.get(StorageService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    const uploadDto: UploadFileDto = {
      folder: 'documents',
      description: 'Test document',
    };

    it('should upload a file successfully', async () => {
      const expectedResult = {
        url: '/uploads/documents/test-file.pdf',
        key: 'documents/test-file.pdf',
        originalName: 'test-file.pdf',
        size: 12,
        mimeType: 'application/pdf',
      };
      mockStorageService.uploadFile.mockResolvedValue(expectedResult);

      const result = await controller.uploadFile(mockFile, uploadDto);

      expect(result).toEqual({
        message: 'File uploaded successfully',
        file: expectedResult,
      });
      expect(storageService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'documents',
      );
    });

    // Note: The ParseFilePipe in the actual controller handles file validation
    // before reaching the method, so we test the happy path and validation separately

    it('should use default folder if not specified', async () => {
      const expectedResult = {
        url: '/uploads/general/test-file.pdf',
        key: 'general/test-file.pdf',
        originalName: 'test-file.pdf',
        size: 12,
        mimeType: 'application/pdf',
      };
      mockStorageService.uploadFile.mockResolvedValue(expectedResult);

      const result = await controller.uploadFile(mockFile, {});

      expect(storageService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'general',
      );
      expect(result.file.key).toBe('general/test-file.pdf');
    });
  });

  describe('uploadMultipleFiles', () => {
    const mockFiles: Express.Multer.File[] = [
      { ...mockFile, originalname: 'file1.pdf' },
      { ...mockFile, originalname: 'file2.pdf' },
    ];

    it('should upload multiple files successfully', async () => {
      const expectedResults = [
        {
          url: '/uploads/documents/file1.pdf',
          key: 'documents/file1.pdf',
          originalName: 'file1.pdf',
          size: 12,
          mimeType: 'application/pdf',
        },
        {
          url: '/uploads/documents/file2.pdf',
          key: 'documents/file2.pdf',
          originalName: 'file2.pdf',
          size: 12,
          mimeType: 'application/pdf',
        },
      ];
      mockStorageService.uploadMultiple.mockResolvedValue(expectedResults);

      const result = await controller.uploadMultipleFiles(mockFiles, {
        folder: 'documents',
      });

      expect(result).toEqual({
        message: '2 file(s) uploaded successfully',
        files: expectedResults,
        count: 2,
      });
    });

    it('should throw BadRequestException if no files provided', async () => {
      await expect(
        controller.uploadMultipleFiles([], { folder: 'documents' }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.uploadMultipleFiles(
          undefined as unknown as Express.Multer.File[],
          { folder: 'documents' },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getFile', () => {
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockResponse = {
        setHeader: jest.fn(),
      };
    });

    it('should return a file stream', () => {
      const mockStream = new Readable({
        read() {
          this.push(Buffer.from('test content'));
          this.push(null);
        },
      });
      mockStream.pipe = jest.fn();

      mockStorageService.getFileStream.mockReturnValue(
        mockStream as unknown as ReturnType<
          typeof mockStorageService.getFileStream
        >,
      );

      controller.getFile('documents', 'test.pdf', mockResponse as Response);

      expect(storageService.getFileStream).toHaveBeenCalledWith(
        'documents/test.pdf',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/pdf',
      );
      expect(mockStream.pipe).toHaveBeenCalledWith(mockResponse);
    });

    it('should throw NotFoundException if file does not exist', () => {
      mockStorageService.getFileStream.mockReturnValue(null);

      expect(() =>
        controller.getFile(
          'documents',
          'nonexistent.pdf',
          mockResponse as Response,
        ),
      ).toThrow(NotFoundException);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file successfully', async () => {
      mockStorageService.fileExists.mockReturnValue(true);
      mockStorageService.deleteFile.mockResolvedValue(true);

      const result = await controller.deleteFile('documents', 'test.pdf');

      expect(result).toEqual({
        message: 'File deleted successfully',
        deleted: true,
      });
      expect(storageService.deleteFile).toHaveBeenCalledWith(
        'documents/test.pdf',
      );
    });

    it('should throw NotFoundException if file does not exist', async () => {
      mockStorageService.fileExists.mockReturnValue(false);

      await expect(
        controller.deleteFile('documents', 'nonexistent.pdf'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkFileExists', () => {
    it('should return true if file exists', () => {
      mockStorageService.fileExists.mockReturnValue(true);
      mockStorageService.getPublicUrl.mockReturnValue(
        '/uploads/documents/test.pdf',
      );

      const result = controller.checkFileExists('documents', 'test.pdf');

      expect(result).toEqual({
        exists: true,
        url: '/uploads/documents/test.pdf',
      });
    });

    it('should return false if file does not exist', () => {
      mockStorageService.fileExists.mockReturnValue(false);

      const result = controller.checkFileExists('documents', 'nonexistent.pdf');

      expect(result).toEqual({
        exists: false,
        url: null,
      });
    });
  });
});
