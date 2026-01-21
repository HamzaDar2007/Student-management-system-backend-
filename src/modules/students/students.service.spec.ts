import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StudentsService } from './students.service';
import { Student } from './entities/student.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Grade } from '../grades/entities/grade.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { CacheService } from '../../common/services/cache.service';

describe('StudentsService', () => {
  let service: StudentsService;
  let studentRepository: any;
  let gradeRepository: any;
  let attendanceRepository: any;
  let cacheService: CacheService;

  const mockStudent = {
    id: 1,
    studentId: 'STU001',
    dateOfBirth: new Date('2000-01-01'),
    enrollmentDate: new Date('2023-09-01'),
    status: 'ACTIVE',
    user: {
      id: 1,
      email: 'student@example.com',
      username: 'student1',
      role: 'student',
      firstName: 'John',
      lastName: 'Doe',
    },
  };

  const mockStudentRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    restore: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockStudent], 1]),
    })),
  };

  const mockEnrollmentRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockGradeRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockAttendanceRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    invalidateByPrefix: jest.fn(),
    reset: jest.fn(),
    getOrSet: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        {
          provide: getRepositoryToken(Student),
          useValue: mockStudentRepository,
        },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: mockEnrollmentRepository,
        },
        {
          provide: getRepositoryToken(Grade),
          useValue: mockGradeRepository,
        },
        {
          provide: getRepositoryToken(Attendance),
          useValue: mockAttendanceRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    studentRepository = module.get(getRepositoryToken(Student));
    gradeRepository = module.get(getRepositoryToken(Grade));
    attendanceRepository = module.get(getRepositoryToken(Attendance));
    cacheService = module.get<CacheService>(CacheService);

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default cache behavior - execute the factory function
    mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
      return await factory();
    });
  });

  describe('findAll', () => {
    it('should return paginated students', async () => {
      mockStudentRepository.findAndCount.mockResolvedValue([[mockStudent], 1]);
      const query = { page: 1, limit: 10 };

      const result = await service.findAll(query);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
    });

    it('should filter by department', async () => {
      mockStudentRepository.findAndCount.mockResolvedValue([[mockStudent], 1]);
      const query = { page: 1, limit: 10, department_id: 1 };

      const result = await service.findAll(query);

      expect(result).toHaveProperty('items');
    });
  });

  describe('findOne', () => {
    it('should return a student by id', async () => {
      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockEnrollmentRepository.find.mockResolvedValue([]);

      const result = await service.findOne(1);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('enrollments');
    });

    it('should throw NotFoundException if student not found', async () => {
      mockStudentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createStudentDto = {
      student_id: 'STU002',
      date_of_birth: '2000-01-01',
      enrollment_date: '2023-09-01',
    };

    it('should create a new student', async () => {
      mockStudentRepository.findOne.mockResolvedValue(null);
      mockStudentRepository.create.mockReturnValue({ id: 1 });
      mockStudentRepository.save.mockResolvedValue({
        id: 1,
        studentId: createStudentDto.student_id,
      });

      const result = await service.create(createStudentDto);

      expect(result).toHaveProperty('id');
    });
  });

  describe('update', () => {
    const updateStudentDto = {
      address: 'New Address',
      phone: '+1234567890',
    };

    it('should update a student', async () => {
      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockStudentRepository.save.mockResolvedValue({
        ...mockStudent,
        address: updateStudentDto.address,
      });

      const result = await service.update(1, updateStudentDto);

      expect(result).toBeDefined();
      expect(mockCacheService.delete).toHaveBeenCalledWith('student:1');
    });

    it('should throw NotFoundException if student not found', async () => {
      mockStudentRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateStudentDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a student', async () => {
      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockStudentRepository.softRemove.mockResolvedValue(mockStudent);

      const result = await service.remove(1);

      expect(result).toEqual({ deleted: true });
      expect(mockCacheService.delete).toHaveBeenCalledWith('student:1');
    });

    it('should throw NotFoundException if student not found', async () => {
      mockStudentRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getGrades', () => {
    it('should return student grades', async () => {
      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockGradeRepository.find.mockResolvedValue([]);

      const result = await service.getGrades(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw NotFoundException if student not found', async () => {
      mockStudentRepository.findOne.mockResolvedValue(null);

      await expect(service.getGrades(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAttendance', () => {
    it('should return student attendance', async () => {
      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockAttendanceRepository.find.mockResolvedValue([]);

      const result = await service.getAttendance(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw NotFoundException if student not found', async () => {
      mockStudentRepository.findOne.mockResolvedValue(null);

      await expect(service.getAttendance(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
