import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { AcademicTermsService } from './academic-terms.service';
import { AcademicTerm } from './entities/academic-term.entity';

describe('AcademicTermsService', () => {
  let service: AcademicTermsService;

  const mockTerm = {
    id: 1,
    name: 'Fall 2023',
    startDate: new Date('2023-09-01'),
    endDate: new Date('2023-12-15'),
    isActive: true,
  };

  const mockTermRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicTermsService,
        {
          provide: getRepositoryToken(AcademicTerm),
          useValue: mockTermRepository,
        },
      ],
    }).compile();

    service = module.get<AcademicTermsService>(AcademicTermsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated academic terms', async () => {
      mockTermRepository.findAndCount.mockResolvedValue([[mockTerm], 1]);

      const result = await service.findAll(1, 10);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
    });
  });

  describe('findOne', () => {
    it('should return an academic term by id', async () => {
      mockTermRepository.findOne.mockResolvedValue(mockTerm);

      const result = await service.findOne(1);

      expect(result).toEqual(mockTerm);
    });

    it('should throw NotFoundException if term not found', async () => {
      mockTermRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findActive', () => {
    it('should return the active academic term', async () => {
      mockTermRepository.findOne.mockResolvedValue(mockTerm);

      const result = await service.findActive();

      expect(result).toEqual(mockTerm);
      expect(result?.isActive).toBe(true);
    });

    it('should return null if no active term', async () => {
      mockTermRepository.findOne.mockResolvedValue(null);

      const result = await service.findActive();

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'Spring 2024',
      start_date: '2024-01-15',
      end_date: '2024-05-15',
      is_active: false,
    };

    it('should create a new academic term', async () => {
      mockTermRepository.findOne.mockResolvedValue(null);
      mockTermRepository.create.mockReturnValue(mockTerm);
      mockTermRepository.save.mockResolvedValue(mockTerm);

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id');
    });

    it('should throw ConflictException if name already exists', async () => {
      mockTermRepository.findOne.mockResolvedValue(mockTerm);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if start date is after end date', async () => {
      mockTermRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          ...createDto,
          start_date: '2024-06-01',
          end_date: '2024-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should deactivate other terms when creating an active term', async () => {
      mockTermRepository.findOne.mockResolvedValue(null);
      mockTermRepository.create.mockReturnValue({ ...mockTerm, isActive: true });
      mockTermRepository.update.mockResolvedValue({ affected: 1 });
      mockTermRepository.save.mockResolvedValue({ ...mockTerm, isActive: true });

      await service.create({ ...createDto, is_active: true });

      expect(mockTermRepository.update).toHaveBeenCalledWith({}, { isActive: false });
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Term Name',
    };

    it('should update an academic term', async () => {
      mockTermRepository.findOne
        .mockResolvedValueOnce(mockTerm)  // First call to find the term
        .mockResolvedValueOnce(null);     // Second call to check for duplicate name
      mockTermRepository.save.mockResolvedValue({
        ...mockTerm,
        name: updateDto.name,
      });

      const result = await service.update(1, updateDto);

      expect(result.name).toBe(updateDto.name);
    });

    it('should throw NotFoundException if term not found', async () => {
      mockTermRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if dates are invalid', async () => {
      mockTermRepository.findOne.mockResolvedValue(mockTerm);

      await expect(
        service.update(1, {
          start_date: '2024-06-01',
          end_date: '2024-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete an academic term', async () => {
      mockTermRepository.findOne.mockResolvedValue({ ...mockTerm, isActive: false });
      mockTermRepository.remove.mockResolvedValue({ ...mockTerm, isActive: false });

      const result = await service.remove(1);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException if term not found', async () => {
      mockTermRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if term is active', async () => {
      mockTermRepository.findOne.mockResolvedValue({ ...mockTerm, isActive: true });

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
    });
  });
});
