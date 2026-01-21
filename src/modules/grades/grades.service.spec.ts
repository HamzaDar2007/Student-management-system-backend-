import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { GradesService } from './grades.service';
import { Grade } from './entities/grade.entity';
import { Student } from '../students/entities/student.entity';
import { Course } from '../courses/entities/course.entity';

describe('GradesService', () => {
  let service: GradesService;

  const mockGrade = {
    id: 1,
    studentId: 1,
    courseId: 1,
    assessmentType: 'EXAM',
    assessmentName: 'Midterm Exam',
    maxScore: '100.00',
    scoreObtained: '85.00',
    weightage: '30.00',
    gradedBy: 1,
    gradedAt: new Date(),
  };

  const mockStudent = { id: 1, studentId: 'STU001' };
  const mockCourse = { id: 1, courseCode: 'CS101' };

  const mockGradeRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  const mockStudentRepository = {
    findOne: jest.fn(),
  };

  const mockCourseRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        {
          provide: getRepositoryToken(Grade),
          useValue: mockGradeRepository,
        },
        {
          provide: getRepositoryToken(Student),
          useValue: mockStudentRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: mockCourseRepository,
        },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated grades', async () => {
      mockGradeRepository.findAndCount.mockResolvedValue([[mockGrade], 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
    });
  });

  describe('findOne', () => {
    it('should return a grade by id', async () => {
      mockGradeRepository.findOne.mockResolvedValue(mockGrade);

      const result = await service.findOne(1);

      expect(result).toEqual(mockGrade);
    });

    it('should throw NotFoundException if grade not found', async () => {
      mockGradeRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      student_id: 1,
      course_id: 1,
      assessment_type: 'EXAM',
      assessment_name: 'Midterm Exam',
      max_score: 100,
      score_obtained: 85,
      weightage: 30,
    };

    it('should create a new grade', async () => {
      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockCourseRepository.findOne.mockResolvedValue(mockCourse);
      mockGradeRepository.create.mockReturnValue(mockGrade);
      mockGradeRepository.save.mockResolvedValue(mockGrade);

      const result = await service.create(createDto, 1);

      expect(result).toHaveProperty('id');
    });

    it('should throw NotFoundException if student not found', async () => {
      mockStudentRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if course not found', async () => {
      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockCourseRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      score_obtained: 90,
    };

    it('should update a grade', async () => {
      mockGradeRepository.findOne.mockResolvedValue(mockGrade);
      mockGradeRepository.save.mockResolvedValue({
        ...mockGrade,
        scoreObtained: '90.00',
      });

      const result = await service.update(1, updateDto, 1);

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if grade not found', async () => {
      mockGradeRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a grade', async () => {
      mockGradeRepository.findOne.mockResolvedValue(mockGrade);
      mockGradeRepository.remove.mockResolvedValue(mockGrade);

      const result = await service.remove(1);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException if grade not found', async () => {
      mockGradeRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
