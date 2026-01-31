import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { Department } from './entities/department.entity';
import { Faculty } from '../faculties/entities/faculty.entity';

describe('DepartmentsService', () => {
  let service: DepartmentsService;

  const mockDepartment = {
    id: 1,
    name: 'Computer Science',
    code: 'CS',
    faculty: null,
    students: [],
  };

  const mockFaculty = { id: 1, name: 'Faculty of Science', code: 'FOS' };

  const mockDepartmentRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    restore: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockFacultyRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        {
          provide: getRepositoryToken(Department),
          useValue: mockDepartmentRepository,
        },
        {
          provide: getRepositoryToken(Faculty),
          useValue: mockFacultyRepository,
        },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated departments', async () => {
      mockDepartmentRepository.findAndCount.mockResolvedValue([
        [mockDepartment],
        1,
      ]);

      const result = await service.findAll(1, 10);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('total');
      expect(result.meta).toHaveProperty('page');
      expect(result.meta).toHaveProperty('limit');
    });
  });

  describe('findOne', () => {
    it('should return a department by id', async () => {
      mockDepartmentRepository.findOne.mockResolvedValue(mockDepartment);

      const result = await service.findOne(1);

      expect(result).toEqual(mockDepartment);
    });

    it('should throw NotFoundException if department not found', async () => {
      mockDepartmentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'Mathematics',
      code: 'MATH',
    };

    it('should create a new department', async () => {
      mockDepartmentRepository.findOne.mockResolvedValue(null);
      mockDepartmentRepository.create.mockReturnValue(mockDepartment);
      mockDepartmentRepository.save.mockResolvedValue(mockDepartment);

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id');
    });

    it('should throw ConflictException if name already exists', async () => {
      mockDepartmentRepository.findOne.mockResolvedValueOnce(mockDepartment);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if code already exists', async () => {
      mockDepartmentRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockDepartment);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if faculty not found', async () => {
      mockDepartmentRepository.findOne.mockResolvedValue(null);
      mockFacultyRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({ ...createDto, faculty_id: 999 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Department Name',
    };

    it('should update a department', async () => {
      mockDepartmentRepository.findOne
        .mockResolvedValueOnce(mockDepartment) // First call: find department by id
        .mockResolvedValueOnce(null); // Second call: check name uniqueness
      mockDepartmentRepository.save.mockResolvedValue({
        ...mockDepartment,
        name: updateDto.name,
      });

      const result = await service.update(1, updateDto);

      expect(result.name).toBe(updateDto.name);
    });

    it('should throw NotFoundException if department not found', async () => {
      mockDepartmentRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a department', async () => {
      mockDepartmentRepository.findOne.mockResolvedValue({
        ...mockDepartment,
        students: [],
      });
      mockDepartmentRepository.softDelete.mockResolvedValue({
        raw: [],
        affected: 1,
      });

      const result = await service.remove(1);

      expect(result).toEqual({
        raw: [],
        affected: 1,
      });
    });

    it('should throw NotFoundException if department not found', async () => {
      mockDepartmentRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if department has students', async () => {
      mockDepartmentRepository.findOne.mockResolvedValue({
        ...mockDepartment,
        students: [{ id: 1 }],
      });

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
    });
  });
});
