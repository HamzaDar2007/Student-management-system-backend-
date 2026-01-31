import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { FacultiesService } from './faculties.service';
import { Faculty } from './entities/faculty.entity';
import { User } from '../users/entities/user.entity';

describe('FacultiesService', () => {
  let service: FacultiesService;

  const mockFaculty = {
    id: 1,
    name: 'Faculty of Science',
    code: 'FOS',
    dean: null,
    departments: [],
  };

  const mockUser = { id: 1, firstName: 'John', lastName: 'Dean' };

  const mockFacultyRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    restore: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacultiesService,
        {
          provide: getRepositoryToken(Faculty),
          useValue: mockFacultyRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<FacultiesService>(FacultiesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated faculties', async () => {
      mockFacultyRepository.findAndCount.mockResolvedValue([[mockFaculty], 1]);

      const result = await service.findAll(1, 10);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('total');
      expect(result.meta).toHaveProperty('page');
      expect(result.meta).toHaveProperty('limit');
    });
  });

  describe('findOne', () => {
    it('should return a faculty by id', async () => {
      mockFacultyRepository.findOne.mockResolvedValue(mockFaculty);

      const result = await service.findOne(1);

      expect(result).toEqual(mockFaculty);
    });

    it('should throw NotFoundException if faculty not found', async () => {
      mockFacultyRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'Faculty of Engineering',
      code: 'FOE',
    };

    it('should create a new faculty', async () => {
      mockFacultyRepository.findOne.mockResolvedValue(null);
      mockFacultyRepository.create.mockReturnValue(mockFaculty);
      mockFacultyRepository.save.mockResolvedValue(mockFaculty);

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id');
    });

    it('should throw ConflictException if name already exists', async () => {
      mockFacultyRepository.findOne.mockResolvedValueOnce(mockFaculty);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if code already exists', async () => {
      mockFacultyRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockFaculty);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if dean not found', async () => {
      mockFacultyRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({ ...createDto, dean_id: 999 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Faculty Name',
    };

    it('should update a faculty', async () => {
      mockFacultyRepository.findOne
        .mockResolvedValueOnce(mockFaculty) // First call: find faculty by id
        .mockResolvedValueOnce(null); // Second call: check name uniqueness
      mockFacultyRepository.save.mockResolvedValue({
        ...mockFaculty,
        name: updateDto.name,
      });

      const result = await service.update(1, updateDto);

      expect(result.name).toBe(updateDto.name);
    });

    it('should throw NotFoundException if faculty not found', async () => {
      mockFacultyRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a faculty', async () => {
      mockFacultyRepository.findOne.mockResolvedValue({
        ...mockFaculty,
        departments: [],
      });
      mockFacultyRepository.softRemove.mockResolvedValue({
        ...mockFaculty,
        departments: [],
      });

      const result = await service.remove(1);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException if faculty not found', async () => {
      mockFacultyRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if faculty has departments', async () => {
      mockFacultyRepository.findOne.mockResolvedValue({
        ...mockFaculty,
        departments: [{ id: 1 }],
      });

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
    });
  });
});
