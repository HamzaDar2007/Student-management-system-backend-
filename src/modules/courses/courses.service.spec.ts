import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Course } from './entities/course.entity';
import { User } from '../users/entities/user.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Attendance } from '../attendance/entities/attendance.entity';

describe('CoursesService', () => {
  let service: CoursesService;
  let courseRepository: any;

  const mockCourse = {
    id: 1,
    code: 'CS101',
    name: 'Introduction to Computer Science',
    description: 'Basic concepts of computer science',
    credits: 3,
    maxStudents: 30,
    isActive: true,
    teacher: {
      id: 1,
      firstName: 'John',
      lastName: 'Teacher',
    },
    enrollments: [],
  };

  const mockCourseRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockCourse], 1]),
    })),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockEnrollmentRepository = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: getRepositoryToken(Course),
          useValue: mockCourseRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: mockEnrollmentRepository,
        },
        {
          provide: getRepositoryToken(Attendance),
          useValue: mockAttendanceRepository,
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    courseRepository = module.get(getRepositoryToken(Course));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated courses', async () => {
      const query = { page: 1, limit: 10 };

      const result = await service.findAll(query);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
    });

    it('should filter by active status', async () => {
      const query = { page: 1, limit: 10, is_active: true };

      const result = await service.findAll(query);

      expect(result).toHaveProperty('data');
    });
  });

  describe('findOne', () => {
    it('should return a course by id', async () => {
      mockCourseRepository.findOne.mockResolvedValue(mockCourse);

      const result = await service.findOne(1);

      expect(result).toEqual(mockCourse);
    });

    it('should throw NotFoundException if course not found', async () => {
      mockCourseRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createCourseDto = {
      code: 'CS102',
      name: 'Data Structures',
      description: 'Introduction to data structures',
      credits: 4,
      max_students: 25,
      teacher_id: 1,
    };

    it('should create a new course', async () => {
      mockCourseRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue({ id: 1 });
      mockCourseRepository.create.mockReturnValue(createCourseDto);
      mockCourseRepository.save.mockResolvedValue({
        id: 2,
        ...createCourseDto,
      });

      const result = await service.create(createCourseDto);

      expect(result).toHaveProperty('id');
      expect(result.code).toBe(createCourseDto.code);
    });

    it('should throw ConflictException if course code exists', async () => {
      mockCourseRepository.findOne.mockResolvedValue(mockCourse);

      await expect(service.create(createCourseDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    const updateCourseDto = {
      name: 'Updated Course Name',
      credits: 4,
    };

    it('should update a course', async () => {
      mockCourseRepository.findOne.mockResolvedValue(mockCourse);
      mockCourseRepository.save.mockResolvedValue({
        ...mockCourse,
        ...updateCourseDto,
      });

      const result = await service.update(1, updateCourseDto);

      expect(result.name).toBe(updateCourseDto.name);
    });

    it('should throw NotFoundException if course not found', async () => {
      mockCourseRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateCourseDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a course', async () => {
      mockCourseRepository.findOne.mockResolvedValue(mockCourse);
      mockCourseRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(1);

      expect(result).toEqual({ message: 'Course deleted successfully' });
    });

    it('should throw NotFoundException if course not found', async () => {
      mockCourseRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStudents', () => {
    it('should return enrolled students', async () => {
      mockCourseRepository.findOne.mockResolvedValue(mockCourse);

      const result = await service.getStudents(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw NotFoundException if course not found', async () => {
      mockCourseRepository.findOne.mockResolvedValue(null);

      await expect(service.getStudents(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAttendance', () => {
    it('should return course attendance records', async () => {
      mockCourseRepository.findOne.mockResolvedValue(mockCourse);

      const result = await service.getAttendance(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw NotFoundException if course not found', async () => {
      mockCourseRepository.findOne.mockResolvedValue(null);

      await expect(service.getAttendance(999)).rejects.toThrow(NotFoundException);
    });
  });
});
