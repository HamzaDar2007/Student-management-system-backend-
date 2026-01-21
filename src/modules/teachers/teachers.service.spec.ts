import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { TeacherProfile, AcademicRank } from './entities/teacher-profile.entity';
import { User, UserRole } from '../users/entities/user.entity';

describe('TeachersService', () => {
  let service: TeachersService;

  const mockTeacher = {
    id: 1,
    userId: 1,
    employeeId: 'EMP001',
    rank: AcademicRank.LECTURER,
    specialization: 'Software Engineering',
    officeLocation: 'Room 201',
    officeHours: 'Mon-Fri 2-4pm',
    phone: '+1234567890',
    bio: 'Experienced teacher',
    hireDate: '2020-01-01',
    isActive: true,
    user: {
      id: 1,
      email: 'teacher@test.com',
      firstName: 'John',
      lastName: 'Teacher',
      role: UserRole.TEACHER,
    },
  };

  const mockUser = {
    id: 1,
    email: 'teacher@test.com',
    role: UserRole.TEACHER,
  };

  const mockTeacherRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeachersService,
        {
          provide: getRepositoryToken(TeacherProfile),
          useValue: mockTeacherRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<TeachersService>(TeachersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated teachers', async () => {
      mockTeacherRepository.findAndCount.mockResolvedValue([[mockTeacher], 1]);

      const result = await service.findAll(1, 10);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
    });
  });

  describe('findOne', () => {
    it('should return a teacher by id', async () => {
      mockTeacherRepository.findOne.mockResolvedValue(mockTeacher);

      const result = await service.findOne(1);

      expect(result).toEqual(mockTeacher);
    });

    it('should throw NotFoundException if teacher not found', async () => {
      mockTeacherRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUserId', () => {
    it('should return a teacher by user id', async () => {
      mockTeacherRepository.findOne.mockResolvedValue(mockTeacher);

      const result = await service.findByUserId(1);

      expect(result).toEqual(mockTeacher);
    });

    it('should throw NotFoundException if teacher not found', async () => {
      mockTeacherRepository.findOne.mockResolvedValue(null);

      await expect(service.findByUserId(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      user_id: 1,
      employee_id: 'EMP002',
      rank: AcademicRank.ASSISTANT_PROFESSOR,
      specialization: 'Algebra',
    };

    it('should create a new teacher profile', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockTeacherRepository.findOne.mockResolvedValue(null);
      mockTeacherRepository.create.mockReturnValue(mockTeacher);
      mockTeacherRepository.save.mockResolvedValue(mockTeacher);

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user is not a teacher', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, role: UserRole.STUDENT });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if profile already exists for user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockTeacherRepository.findOne.mockResolvedValueOnce(mockTeacher);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if employee ID already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockTeacherRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockTeacher);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const updateDto = {
      specialization: 'Physics',
    };

    it('should update a teacher profile', async () => {
      mockTeacherRepository.findOne.mockResolvedValue(mockTeacher);
      mockTeacherRepository.save.mockResolvedValue({
        ...mockTeacher,
        specialization: updateDto.specialization,
      });

      const result = await service.update(1, updateDto);

      expect(result.specialization).toBe(updateDto.specialization);
    });

    it('should throw NotFoundException if teacher not found', async () => {
      mockTeacherRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if employee ID already exists', async () => {
      mockTeacherRepository.findOne
        .mockResolvedValueOnce(mockTeacher)
        .mockResolvedValueOnce({ id: 2, employeeId: 'EMP003' });

      await expect(
        service.update(1, { employee_id: 'EMP003' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a teacher profile', async () => {
      mockTeacherRepository.findOne.mockResolvedValue(mockTeacher);
      mockTeacherRepository.remove.mockResolvedValue(mockTeacher);

      const result = await service.remove(1);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException if teacher not found', async () => {
      mockTeacherRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
