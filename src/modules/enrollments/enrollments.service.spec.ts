import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { Student } from '../students/entities/student.entity';
import { Course } from '../courses/entities/course.entity';
import { Grade } from '../grades/entities/grade.entity';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;

  const mockEnrollment = {
    id: 1,
    studentId: 1,
    courseId: 1,
    enrollmentDate: '2023-09-01',
    status: EnrollmentStatus.ACTIVE,
    student: { id: 1, studentId: 'STU001' },
    course: { id: 1, courseCode: 'CS101' },
  };

  const mockStudent = { id: 1, studentId: 'STU001' };
  const mockCourse = { id: 1, courseCode: 'CS101', maxStudents: 30 };

  const mockEnrollmentRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockStudentRepository = {
    findOne: jest.fn(),
  };

  const mockCourseRepository = {
    findOne: jest.fn(),
  };

  const mockGradeRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        {
          provide: getRepositoryToken(Enrollment),
          useValue: mockEnrollmentRepository,
        },
        {
          provide: getRepositoryToken(Student),
          useValue: mockStudentRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: mockCourseRepository,
        },
        {
          provide: getRepositoryToken(Grade),
          useValue: mockGradeRepository,
        },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated enrollments', async () => {
      mockEnrollmentRepository.findAndCount.mockResolvedValue([
        [mockEnrollment],
        1,
      ]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('total');
      expect(result.meta).toHaveProperty('page');
      expect(result.meta).toHaveProperty('limit');
    });
  });

  describe('findOne', () => {
    it('should return an enrollment by id', async () => {
      mockEnrollmentRepository.findOne.mockResolvedValue(mockEnrollment);

      const result = await service.findOne(1);

      expect(result).toEqual(mockEnrollment);
    });

    it('should throw NotFoundException if enrollment not found', async () => {
      mockEnrollmentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      student_id: 1,
      course_id: 1,
      enrollment_date: '2023-09-01',
    };

    it('should create a new enrollment', async () => {
      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockCourseRepository.findOne.mockResolvedValue(mockCourse);
      mockEnrollmentRepository.findOne.mockResolvedValue(null);
      mockEnrollmentRepository.count.mockResolvedValue(5);
      mockEnrollmentRepository.create.mockReturnValue(mockEnrollment);
      mockEnrollmentRepository.save.mockResolvedValue(mockEnrollment);

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id');
    });

    it('should throw NotFoundException if student not found', async () => {
      mockStudentRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if course not found', async () => {
      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockCourseRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if enrollment already exists', async () => {
      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockCourseRepository.findOne.mockResolvedValue(mockCourse);
      mockEnrollmentRepository.findOne.mockResolvedValue(mockEnrollment);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if course is full', async () => {
      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockCourseRepository.findOne.mockResolvedValue(mockCourse);
      mockEnrollmentRepository.findOne.mockResolvedValue(null);
      mockEnrollmentRepository.count.mockResolvedValue(30);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
