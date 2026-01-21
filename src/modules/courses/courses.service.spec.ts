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
    courseCode: 'CS101',
    courseName: 'Introduction to Computer Science',
    description: 'Basic concepts of computer science',
    credits: 3,
    maxStudents: 30,
    isActive: true,
    teachers: [],
    enrollments: [],
  };

  const mockCourseRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
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

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
    });

    it('should filter by active status', async () => {
      const query = { page: 1, limit: 10, is_active: true };

      const result = await service.findAll(query);

      expect(result).toHaveProperty('items');
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
      course_code: 'CS102',
      course_name: 'Data Structures',
      description: 'Introduction to data structures',
      credits: 4,
      max_students: 25,
    };

    it('should create a new course', async () => {
      mockCourseRepository.findOne.mockResolvedValue(null);
      mockCourseRepository.create.mockReturnValue({
        courseCode: createCourseDto.course_code,
        courseName: createCourseDto.course_name,
      });
      mockCourseRepository.save.mockResolvedValue({
        id: 2,
        courseCode: createCourseDto.course_code,
        courseName: createCourseDto.course_name,
      });

      const result = await service.create(createCourseDto);

      expect(result).toHaveProperty('id');
      expect(result.courseCode).toBe(createCourseDto.course_code);
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
      course_name: 'Updated Course Name',
      credits: 4,
    };

    it('should update a course', async () => {
      mockCourseRepository.findOne.mockResolvedValue(mockCourse);
      mockCourseRepository.save.mockResolvedValue({
        ...mockCourse,
        courseName: updateCourseDto.course_name,
      });

      const result = await service.update(1, updateCourseDto);

      expect(result.courseName).toBe(updateCourseDto.course_name);
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
      mockCourseRepository.remove.mockResolvedValue(mockCourse);

      const result = await service.remove(1);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException if course not found', async () => {
      mockCourseRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStudents', () => {
    it('should return enrolled students', async () => {
      mockCourseRepository.findOne.mockResolvedValue(mockCourse);
      mockEnrollmentRepository.find.mockResolvedValue([]);

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
      mockAttendanceRepository.find.mockResolvedValue([]);

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
