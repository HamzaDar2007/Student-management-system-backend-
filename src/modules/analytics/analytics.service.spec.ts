import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { TeacherProfile } from '../teachers/entities/teacher-profile.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Schedule } from '../scheduling/entities/schedule.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
    getCount: jest.fn(),
  };

  const mockRepo = {
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(User), useValue: mockRepo as any },
        { provide: getRepositoryToken(Student), useValue: mockRepo as any },
        {
          provide: getRepositoryToken(TeacherProfile),
          useValue: mockRepo as any,
        },
        { provide: getRepositoryToken(Course), useValue: mockRepo as any },
        { provide: getRepositoryToken(Enrollment), useValue: mockRepo as any },
        { provide: getRepositoryToken(Attendance), useValue: mockRepo as any },
        { provide: getRepositoryToken(Schedule), useValue: mockRepo as any },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdminStats', () => {
    it('should return admin stats', async () => {
      mockRepo.count.mockResolvedValueOnce(100); // Students
      mockRepo.count.mockResolvedValueOnce(10); // Teachers
      mockRepo.count.mockResolvedValueOnce(5); // Active Courses
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({
        total: '200',
        present: '180',
      });

      const result = await service.getAdminStats();

      expect(result).toEqual({
        totalStudents: 100,
        totalTeachers: 10,
        activeCourses: 5,
        avgAttendance: '90%',
      });
    });
  });

  describe('getTeacherStats', () => {
    it('should return teacher stats', async () => {
      const mockTeacher = { id: 1, userId: 1 };
      mockRepo.findOne.mockResolvedValue(mockTeacher);

      mockQueryBuilder.getCount.mockResolvedValueOnce(3); // My Courses (Now uses QueryBuilder)
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ count: '50' }); // Total Students
      mockQueryBuilder.getCount.mockResolvedValueOnce(5); // Pending Grades
      mockQueryBuilder.getCount.mockResolvedValueOnce(2); // Classes Today

      const result = await service.getTeacherStats(1);

      expect(result).toEqual({
        myCourses: 3,
        totalStudents: 50,
        pendingGrades: 5,
        classesToday: 2,
      });
    });
  });

  describe('getStudentStats', () => {
    it('should return student stats', async () => {
      const mockStudent = { id: 1, userId: 1 };
      mockRepo.findOne.mockResolvedValue(mockStudent);

      mockRepo.count.mockResolvedValueOnce(4); // Enrolled Courses
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({
        total: '20',
        present: '15',
      }); // Attendance
      mockRepo.find.mockResolvedValue([{ grade: 'A' }, { grade: 'B' }]); // Grades
      mockQueryBuilder.getCount.mockResolvedValueOnce(2); // Classes Today

      const result = await service.getStudentStats(1);

      // GPA: (4 + 3) / 2 = 3.50
      // Attendance: 15 / 20 = 75%
      expect(result).toEqual({
        enrolledCourses: 4,
        attendanceRate: '75%',
        gpa: '3.50',
        classesToday: 2,
      });
    });
  });
});
