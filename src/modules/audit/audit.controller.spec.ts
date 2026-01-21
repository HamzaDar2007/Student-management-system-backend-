import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';

describe('AuditController', () => {
  let controller: AuditController;
  let auditService: jest.Mocked<AuditService>;

  const mockAuditLog = {
    id: 1,
    userId: 1,
    action: 'CREATE',
    resource: 'Student',
    resourceId: '123',
    payload: { name: 'John Doe' },
    createdAt: new Date('2024-01-15T10:00:00Z'),
    user: {
      id: 1,
      email: 'admin@test.com',
      first_name: 'Admin',
      last_name: 'User',
    },
  };

  const mockAuditService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByResource: jest.fn(),
    findByUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    auditService = module.get(AuditService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      const query: AuditQueryDto = { page: 1, limit: 10 };
      const expected = {
        items: [mockAuditLog],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockAuditService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(auditService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });

    it('should filter by action', async () => {
      const query: AuditQueryDto = { action: 'CREATE' };
      const expected = {
        items: [mockAuditLog],
        total: 1,
        page: 1,
        limit: 20,
      };
      mockAuditService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(auditService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return an audit log by id', async () => {
      mockAuditService.findOne.mockResolvedValue(mockAuditLog);

      const result = await controller.findOne(1);

      expect(auditService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAuditLog);
    });

    it('should return null if not found', async () => {
      mockAuditService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(999);

      expect(auditService.findOne).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  describe('findByResource', () => {
    it('should return audit logs for a resource', async () => {
      const mockLogs = [mockAuditLog];
      mockAuditService.findByResource.mockResolvedValue(mockLogs);

      const result = await controller.findByResource('Student', '123');

      expect(auditService.findByResource).toHaveBeenCalledWith('Student', '123');
      expect(result).toEqual(mockLogs);
    });

    it('should return empty array when no logs found', async () => {
      mockAuditService.findByResource.mockResolvedValue([]);

      const result = await controller.findByResource('Course', '999');

      expect(auditService.findByResource).toHaveBeenCalledWith('Course', '999');
      expect(result).toEqual([]);
    });
  });

  describe('findByUser', () => {
    it('should return audit logs for a user', async () => {
      const mockLogs = [mockAuditLog];
      mockAuditService.findByUser.mockResolvedValue(mockLogs);

      const result = await controller.findByUser(1);

      expect(auditService.findByUser).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockLogs);
    });

    it('should return empty array when user has no logs', async () => {
      mockAuditService.findByUser.mockResolvedValue([]);

      const result = await controller.findByUser(999);

      expect(auditService.findByUser).toHaveBeenCalledWith(999);
      expect(result).toEqual([]);
    });
  });
});
