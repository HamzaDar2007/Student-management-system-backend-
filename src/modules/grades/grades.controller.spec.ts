import { Test, TestingModule } from '@nestjs/testing';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradeListQueryDto } from './dto/grade-list-query.dto';
import { User, UserRole } from '../users/entities/user.entity';

describe('GradesController', () => {
  let controller: GradesController;
  let gradesService: jest.Mocked<GradesService>;

  const mockGrade = {
    id: 1,
    student_id: 1,
    course_id: 1,
    assessment_type: 'exam',
    assessment_name: 'Midterm Exam',
    max_score: 100,
    score_obtained: 85,
    weightage: 30,
    graded_by: 1,
    graded_at: new Date(),
  };

  const mockUser: Partial<User> = {
    id: 1,
    email: 'teacher@test.com',
    role: UserRole.TEACHER,
  };

  const mockGradesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getCourseGrades: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradesController],
      providers: [
        {
          provide: GradesService,
          useValue: mockGradesService,
        },
      ],
    }).compile();

    controller = module.get<GradesController>(GradesController);
    gradesService = module.get(GradesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new grade', async () => {
      const dto: CreateGradeDto = {
        student_id: 1,
        course_id: 1,
        assessment_type: 'exam',
        assessment_name: 'Final Exam',
        max_score: 100,
        score_obtained: 90,
        weightage: 40,
      };
      mockGradesService.create.mockResolvedValue(mockGrade);

      const result = await controller.create(dto, mockUser as User);

      expect(gradesService.create).toHaveBeenCalledWith(dto, mockUser.id);
      expect(result).toEqual(mockGrade);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of grades', async () => {
      const query: GradeListQueryDto = { page: 1, limit: 10 };
      const expected = {
        items: [mockGrade],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockGradesService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(gradesService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('courseGrades', () => {
    it('should return grades for a course', async () => {
      const mockCourseGrades = [mockGrade];
      mockGradesService.getCourseGrades.mockResolvedValue(mockCourseGrades);

      const result = await controller.courseGrades(1);

      expect(gradesService.getCourseGrades).toHaveBeenCalledWith(1, undefined);
      expect(result).toEqual(mockCourseGrades);
    });

    it('should filter by assessment type', async () => {
      const mockCourseGrades = [mockGrade];
      mockGradesService.getCourseGrades.mockResolvedValue(mockCourseGrades);

      const result = await controller.courseGrades(1, 'exam');

      expect(gradesService.getCourseGrades).toHaveBeenCalledWith(1, 'exam');
      expect(result).toEqual(mockCourseGrades);
    });
  });

  describe('findOne', () => {
    it('should return a grade by id', async () => {
      mockGradesService.findOne.mockResolvedValue(mockGrade);

      const result = await controller.findOne(1);

      expect(gradesService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockGrade);
    });
  });

  describe('update', () => {
    it('should update a grade', async () => {
      const dto: UpdateGradeDto = { score_obtained: 90 };
      const updatedGrade = { ...mockGrade, score_obtained: 90 };
      mockGradesService.update.mockResolvedValue(updatedGrade);

      const result = await controller.update(1, dto, mockUser as User);

      expect(gradesService.update).toHaveBeenCalledWith(1, dto, mockUser.id);
      expect(result).toEqual(updatedGrade);
    });
  });

  describe('remove', () => {
    it('should remove a grade', async () => {
      const expected = { message: 'Grade deleted successfully' };
      mockGradesService.remove.mockResolvedValue(expected);

      const result = await controller.remove(1);

      expect(gradesService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });
});
