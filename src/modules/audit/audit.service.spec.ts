import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit.entity';
import { CreateAuditDto } from './dto/create-audit.dto';
import { AuditQueryDto } from './dto/audit-query.dto';

describe('AuditService', () => {
  let service: AuditService;
  let repository: jest.Mocked<Repository<AuditLog>>;

  const mockUser = {
    id: 1,
    email: 'admin@test.com',
    first_name: 'Admin',
    last_name: 'User',
  };

  const mockAuditLog: AuditLog = {
    id: 1,
    userId: 1,
    user: mockUser as any,
    action: 'CREATE',
    resource: 'Student',
    resourceId: '123',
    payload: { name: 'John Doe' },
    createdAt: new Date('2024-01-15T10:00:00Z'),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repository = module.get(getRepositoryToken(AuditLog));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create and save an audit log entry', async () => {
      const createDto: CreateAuditDto = {
        user_id: 1,
        action: 'CREATE',
        resource: 'Student',
        resource_id: '123',
        payload: { name: 'John Doe' },
      };

      mockRepository.create.mockReturnValue(mockAuditLog);
      mockRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.log(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: createDto.user_id,
        action: createDto.action,
        resource: createDto.resource,
        resourceId: createDto.resource_id,
        payload: createDto.payload,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockAuditLog);
      expect(result).toEqual(mockAuditLog);
    });

    it('should handle null optional fields', async () => {
      const createDto: CreateAuditDto = {
        action: 'DELETE',
        resource: 'Course',
      };

      const auditLogWithNulls = {
        ...mockAuditLog,
        userId: null,
        resourceId: null,
        payload: null,
      };

      mockRepository.create.mockReturnValue(auditLogWithNulls);
      mockRepository.save.mockResolvedValue(auditLogWithNulls);

      const result = await service.log(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: null,
        action: 'DELETE',
        resource: 'Course',
        resourceId: null,
        payload: null,
      });
      expect(result).toEqual(auditLogWithNulls);
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs with default pagination', async () => {
      const query: AuditQueryDto = {};
      const mockItems = [mockAuditLog];

      mockRepository.findAndCount.mockResolvedValue([mockItems, 1]);

      const result = await service.findAll(query);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        relations: ['user'],
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
      expect(result).toEqual({
        data: mockItems,
        meta: {
          page: 1,
          limit: 20,
          total: 1,
          lastPage: 1,
        },
      });
    });

    it('should apply custom pagination', async () => {
      const query: AuditQueryDto = { page: 2, limit: 10 };
      const mockItems = [mockAuditLog];

      mockRepository.findAndCount.mockResolvedValue([mockItems, 15]);

      const result = await service.findAll(query);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        relations: ['user'],
        order: { createdAt: 'DESC' },
        skip: 10,
        take: 10,
      });
      expect(result).toEqual({
        data: mockItems,
        meta: {
          page: 2,
          limit: 10,
          total: 15,
          lastPage: 2,
        },
      });
    });

    it('should filter by user_id', async () => {
      const query: AuditQueryDto = { user_id: 1 };

      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(query);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1 },
        }),
      );
    });

    it('should filter by action', async () => {
      const query: AuditQueryDto = { action: 'UPDATE' };

      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(query);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { action: 'UPDATE' },
        }),
      );
    });

    it('should filter by resource', async () => {
      const query: AuditQueryDto = { resource: 'Student' };

      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(query);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { resource: 'Student' },
        }),
      );
    });

    it('should filter by resource_id', async () => {
      const query: AuditQueryDto = { resource_id: '123' };

      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(query);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { resourceId: '123' },
        }),
      );
    });

    it('should filter by date range when both dates provided', async () => {
      const query: AuditQueryDto = {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };

      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(query);

      const expectedCall = mockRepository.findAndCount.mock.calls[0][0];
      expect(expectedCall.where.createdAt).toBeDefined();
    });

    it('should combine multiple filters', async () => {
      const query: AuditQueryDto = {
        user_id: 1,
        action: 'CREATE',
        resource: 'Student',
        resource_id: '123',
        page: 1,
        limit: 10,
      };

      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(query);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 1,
            action: 'CREATE',
            resource: 'Student',
            resourceId: '123',
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an audit log by id with user relation', async () => {
      mockRepository.findOne.mockResolvedValue(mockAuditLog);

      const result = await service.findOne(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user'],
      });
      expect(result).toEqual(mockAuditLog);
    });

    it('should throw NotFoundException when audit log not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['user'],
      });
    });
  });

  describe('findByResource', () => {
    it('should return audit logs for a specific resource', async () => {
      const mockLogs = [mockAuditLog];
      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.findByResource('Student', '123');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { resource: 'Student', resourceId: '123' },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockLogs);
    });

    it('should return empty array when no logs found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByResource('Course', '999');

      expect(result).toEqual([]);
    });
  });

  describe('findByUser', () => {
    it('should return audit logs for a specific user with default limit', async () => {
      const mockLogs = [mockAuditLog];
      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.findByUser(1);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual(mockLogs);
    });

    it('should return audit logs with custom limit', async () => {
      const mockLogs = [mockAuditLog];
      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.findByUser(1, 10);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { createdAt: 'DESC' },
        take: 10,
      });
      expect(result).toEqual(mockLogs);
    });

    it('should return empty array when user has no logs', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByUser(999);

      expect(result).toEqual([]);
    });
  });
});
