import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentListQueryDto } from './dto/enrollment-list-query.dto';
import { User, UserRole } from '../users/entities/user.entity';

describe('EnrollmentsController', () => {
  let controller: EnrollmentsController;
  let enrollmentsService: jest.Mocked<EnrollmentsService>;

  const mockEnrollment = {
    id: 1,
    student_id: 1,
    course_id: 1,
    enrolled_at: new Date(),
    status: 'active',
    grade: null,
    student: { id: 1, student_id: 'STU001' },
    course: { id: 1, course_code: 'CS101' },
  };

  const mockUser: Partial<User> = {
    id: 1,
    email: 'teacher@test.com',
    role: UserRole.TEACHER,
  };

  const mockEnrollmentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateGrade: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollmentsController],
      providers: [
        {
          provide: EnrollmentsService,
          useValue: mockEnrollmentsService,
        },
      ],
    }).compile();

    controller = module.get<EnrollmentsController>(EnrollmentsController);
    enrollmentsService = module.get(EnrollmentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new enrollment', async () => {
      const dto: CreateEnrollmentDto = {
        student_id: 1,
        course_id: 1,
      };
      mockEnrollmentsService.create.mockResolvedValue(mockEnrollment);

      const result = await controller.create(dto);

      expect(enrollmentsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of enrollments', async () => {
      const query: EnrollmentListQueryDto = { page: 1, limit: 10 };
      const expected = {
        items: [mockEnrollment],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockEnrollmentsService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(enrollmentsService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return an enrollment by id', async () => {
      mockEnrollmentsService.findOne.mockResolvedValue(mockEnrollment);

      const result = await controller.findOne(1);

      expect(enrollmentsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('update', () => {
    it('should update an enrollment', async () => {
      const dto: UpdateEnrollmentDto = { status: 'completed' };
      const updatedEnrollment = { ...mockEnrollment, status: 'completed' };
      mockEnrollmentsService.update.mockResolvedValue(updatedEnrollment);

      const result = await controller.update(1, dto);

      expect(enrollmentsService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedEnrollment);
    });
  });

  describe('remove', () => {
    it('should remove an enrollment', async () => {
      const expected = { message: 'Enrollment deleted successfully' };
      mockEnrollmentsService.remove.mockResolvedValue(expected);

      const result = await controller.remove(1);

      expect(enrollmentsService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });

  describe('updateGrade', () => {
    it('should update enrollment grade', async () => {
      const grade = 'A';
      const updatedEnrollment = { ...mockEnrollment, grade: 'A' };
      mockEnrollmentsService.updateGrade.mockResolvedValue(updatedEnrollment);

      const result = await controller.updateGrade(1, grade, mockUser as User);

      expect(enrollmentsService.updateGrade).toHaveBeenCalledWith(1, grade, mockUser.id);
      expect(result).toEqual(updatedEnrollment);
    });
  });
});
