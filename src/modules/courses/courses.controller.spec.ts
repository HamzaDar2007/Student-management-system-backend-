import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseListQueryDto } from './dto/course-list-query.dto';

describe('CoursesController', () => {
  let controller: CoursesController;
  let coursesService: jest.Mocked<CoursesService>;

  const mockCourse = {
    id: 1,
    course_code: 'CS101',
    course_name: 'Introduction to Programming',
    description: 'A beginner course',
    credits: 3,
    department_id: 1,
    semester: 1,
    max_students: 30,
    is_active: true,
    created_by: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockCoursesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getStudents: jest.fn(),
    getAttendance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
    coursesService = module.get(CoursesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new course', async () => {
      const dto: CreateCourseDto = {
        course_code: 'CS102',
        course_name: 'Data Structures',
        credits: 3,
        department_id: 1,
        semester: 2,
      };
      mockCoursesService.create.mockResolvedValue(mockCourse);

      const result = await controller.create(dto);

      expect(coursesService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockCourse);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of courses', async () => {
      const query: CourseListQueryDto = { page: 1, limit: 10 };
      const expected = {
        items: [mockCourse],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockCoursesService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(coursesService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return a course by id', async () => {
      mockCoursesService.findOne.mockResolvedValue(mockCourse);

      const result = await controller.findOne(1);

      expect(coursesService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCourse);
    });
  });

  describe('update', () => {
    it('should update a course', async () => {
      const dto: UpdateCourseDto = { course_name: 'Updated Course' };
      const updatedCourse = { ...mockCourse, course_name: 'Updated Course' };
      mockCoursesService.update.mockResolvedValue(updatedCourse);

      const result = await controller.update(1, dto);

      expect(coursesService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedCourse);
    });
  });

  describe('remove', () => {
    it('should remove a course', async () => {
      const expected = { message: 'Course deleted successfully' };
      mockCoursesService.remove.mockResolvedValue(expected);

      const result = await controller.remove(1);

      expect(coursesService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });

  describe('students', () => {
    it('should return students enrolled in course', async () => {
      const mockStudents = [
        { id: 1, student_id: 'STU001', user: { first_name: 'John' } },
      ];
      mockCoursesService.getStudents.mockResolvedValue(mockStudents);

      const result = await controller.students(1);

      expect(coursesService.getStudents).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockStudents);
    });
  });

  describe('attendance', () => {
    it('should return course attendance records', async () => {
      const mockAttendance = [
        { id: 1, date: new Date(), student_id: 1, status: 'present' },
      ];
      mockCoursesService.getAttendance.mockResolvedValue(mockAttendance);

      const result = await controller.attendance(1);

      expect(coursesService.getAttendance).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAttendance);
    });
  });
});
