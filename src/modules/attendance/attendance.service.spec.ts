import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { Student } from '../students/entities/student.entity';
import { Course } from '../courses/entities/course.entity';

describe('AttendanceService', () => {
  let service: AttendanceService;

  const mockAttendance = {
    id: 1,
    studentId: 1,
    courseId: 1,
    date: '2023-09-15',
    status: AttendanceStatus.PRESENT,
    notes: null,
    recordedBy: 1,
  };

  const mockStudent = { id: 1, studentId: 'STU001' };
  const mockCourse = { id: 1, courseCode: 'CS101' };

  const mockAttendanceRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    find: jest.fn(),
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
        AttendanceService,
        {
          provide: getRepositoryToken(Attendance),
          useValue: mockAttendanceRepository,
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

    service = module.get<AttendanceService>(AttendanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated attendance records', async () => {
      mockAttendanceRepository.findAndCount.mockResolvedValue([
        [mockAttendance],
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
    it('should return an attendance record by id', async () => {
      mockAttendanceRepository.findOne.mockResolvedValue(mockAttendance);

      const result = await service.findOne(1);

      expect(result).toEqual(mockAttendance);
    });

    it('should throw NotFoundException if attendance not found', async () => {
      mockAttendanceRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      student_id: 1,
      course_id: 1,
      date: '2023-09-15',
      status: AttendanceStatus.PRESENT,
    };

    it('should create a new attendance record', async () => {
      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockCourseRepository.findOne.mockResolvedValue(mockCourse);
      mockAttendanceRepository.findOne.mockResolvedValue(null);
      mockAttendanceRepository.create.mockReturnValue(mockAttendance);
      mockAttendanceRepository.save.mockResolvedValue(mockAttendance);

      const result = await service.create(createDto, 1);

      expect(result).toHaveProperty('id');
    });

    it('should throw NotFoundException if student not found', async () => {
      mockStudentRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if course not found', async () => {
      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockCourseRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if attendance already exists', async () => {
      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockCourseRepository.findOne.mockResolvedValue(mockCourse);
      mockAttendanceRepository.findOne.mockResolvedValue(mockAttendance);

      await expect(service.create(createDto, 1)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      status: AttendanceStatus.ABSENT,
    };

    it('should update an attendance record', async () => {
      mockAttendanceRepository.findOne.mockResolvedValue(mockAttendance);
      mockAttendanceRepository.save.mockResolvedValue({
        ...mockAttendance,
        status: AttendanceStatus.ABSENT,
      });

      const result = await service.update(1, updateDto, 1);

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if attendance not found', async () => {
      mockAttendanceRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete an attendance record', async () => {
      mockAttendanceRepository.findOne.mockResolvedValue(mockAttendance);
      mockAttendanceRepository.remove.mockResolvedValue(mockAttendance);

      const result = await service.remove(1);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException if attendance not found', async () => {
      mockAttendanceRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkCreate', () => {
    const bulkDto = {
      course_id: 1,
      date: '2023-09-15',
      records: [
        { student_id: 1, status: AttendanceStatus.PRESENT },
        { student_id: 2, status: AttendanceStatus.ABSENT },
      ],
    };

    it('should create multiple attendance records', async () => {
      mockCourseRepository.findOne.mockResolvedValue(mockCourse);
      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockAttendanceRepository.findOne.mockResolvedValue(null);
      mockAttendanceRepository.create.mockReturnValue(mockAttendance);
      mockAttendanceRepository.save.mockResolvedValue(mockAttendance);

      const result = await service.bulkCreate(bulkDto, 1);

      expect(result).toHaveProperty('recorded');
      expect(result).toHaveProperty('records');
      expect(Array.isArray(result.records)).toBe(true);
    });

    it('should throw NotFoundException if course not found', async () => {
      mockCourseRepository.findOne.mockResolvedValue(null);

      await expect(service.bulkCreate(bulkDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
