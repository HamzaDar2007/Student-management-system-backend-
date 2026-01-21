import { Test, TestingModule } from '@nestjs/testing';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentListQueryDto } from './dto/student-list-query.dto';

describe('StudentsController', () => {
  let controller: StudentsController;
  let studentsService: jest.Mocked<StudentsService>;

  const mockStudent = {
    id: 1,
    student_id: 'STU001',
    user_id: 1,
    date_of_birth: new Date('2000-01-01'),
    gender: 'male',
    address: '123 Test St',
    phone: '1234567890',
    emergency_contact: '0987654321',
    enrollment_date: new Date(),
    department_id: 1,
    semester: 1,
    user: {
      id: 1,
      email: 'student@test.com',
      first_name: 'Test',
      last_name: 'Student',
    },
  };

  const mockStudentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getGrades: jest.fn(),
    getAttendance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [
        {
          provide: StudentsService,
          useValue: mockStudentsService,
        },
      ],
    }).compile();

    controller = module.get<StudentsController>(StudentsController);
    studentsService = module.get(StudentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new student', async () => {
      const dto: CreateStudentDto = {
        email: 'newstudent@test.com',
        password: 'Password123!',
        first_name: 'New',
        last_name: 'Student',
        student_id: 'STU002',
        date_of_birth: '2000-01-01',
        gender: 'male',
        department_id: 1,
      };
      mockStudentsService.create.mockResolvedValue(mockStudent);

      const result = await controller.create(dto);

      expect(studentsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockStudent);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of students', async () => {
      const query: StudentListQueryDto = { page: 1, limit: 10 };
      const expected = {
        items: [mockStudent],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockStudentsService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(studentsService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return a student by id', async () => {
      mockStudentsService.findOne.mockResolvedValue(mockStudent);

      const result = await controller.findOne(1);

      expect(studentsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockStudent);
    });
  });

  describe('update', () => {
    it('should update a student', async () => {
      const dto: UpdateStudentDto = { phone: '9999999999' };
      const updatedStudent = { ...mockStudent, phone: '9999999999' };
      mockStudentsService.update.mockResolvedValue(updatedStudent);

      const result = await controller.update(1, dto);

      expect(studentsService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedStudent);
    });
  });

  describe('remove', () => {
    it('should remove a student', async () => {
      const expected = { message: 'Student deleted successfully' };
      mockStudentsService.remove.mockResolvedValue(expected);

      const result = await controller.remove(1);

      expect(studentsService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });

  describe('grades', () => {
    it('should return student grades', async () => {
      const mockGrades = [
        { id: 1, assessment_type: 'exam', score_obtained: 85 },
      ];
      mockStudentsService.getGrades.mockResolvedValue(mockGrades);

      const result = await controller.grades(1);

      expect(studentsService.getGrades).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockGrades);
    });
  });

  describe('attendance', () => {
    it('should return student attendance records', async () => {
      const mockAttendance = [{ id: 1, date: new Date(), status: 'present' }];
      mockStudentsService.getAttendance.mockResolvedValue(mockAttendance);

      const result = await controller.attendance(1);

      expect(studentsService.getAttendance).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAttendance);
    });
  });
});
