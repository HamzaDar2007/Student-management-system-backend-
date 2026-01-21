import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceListQueryDto } from './dto/attendance-list-query.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { User, UserRole } from '../users/entities/user.entity';

describe('AttendanceController', () => {
  let controller: AttendanceController;
  let attendanceService: jest.Mocked<AttendanceService>;

  const mockAttendance = {
    id: 1,
    student_id: 1,
    course_id: 1,
    date: new Date('2024-01-15'),
    status: 'present',
    remarks: null,
    recorded_by: 1,
    created_at: new Date(),
  };

  const mockUser: Partial<User> = {
    id: 1,
    email: 'teacher@test.com',
    role: UserRole.TEACHER,
  };

  const mockAttendanceService = {
    create: jest.fn(),
    bulkCreate: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        {
          provide: AttendanceService,
          useValue: mockAttendanceService,
        },
      ],
    }).compile();

    controller = module.get<AttendanceController>(AttendanceController);
    attendanceService = module.get(AttendanceService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an attendance record', async () => {
      const dto: CreateAttendanceDto = {
        student_id: 1,
        course_id: 1,
        date: '2024-01-15',
        status: 'present',
      };
      mockAttendanceService.create.mockResolvedValue(mockAttendance);

      const result = await controller.create(dto, mockUser as User);

      expect(attendanceService.create).toHaveBeenCalledWith(dto, mockUser.id);
      expect(result).toEqual(mockAttendance);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple attendance records', async () => {
      const dto: BulkAttendanceDto = {
        course_id: 1,
        date: '2024-01-15',
        records: [
          { student_id: 1, status: 'present' },
          { student_id: 2, status: 'absent' },
        ],
      };
      const expected = { created: 2, message: 'Bulk attendance created' };
      mockAttendanceService.bulkCreate.mockResolvedValue(expected);

      const result = await controller.bulkCreate(dto, mockUser as User);

      expect(attendanceService.bulkCreate).toHaveBeenCalledWith(dto, mockUser.id);
      expect(result).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of attendance records', async () => {
      const query: AttendanceListQueryDto = { page: 1, limit: 10 };
      const expected = {
        items: [mockAttendance],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockAttendanceService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(attendanceService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('report', () => {
    it('should return attendance report for a course', async () => {
      const mockReport = {
        course_id: 1,
        total_classes: 10,
        attendance_summary: [],
      };
      mockAttendanceService.getReport.mockResolvedValue(mockReport);

      const result = await controller.report(1);

      expect(attendanceService.getReport).toHaveBeenCalledWith(1, undefined, undefined);
      expect(result).toEqual(mockReport);
    });

    it('should filter report by date range', async () => {
      const mockReport = {
        course_id: 1,
        total_classes: 5,
        attendance_summary: [],
      };
      mockAttendanceService.getReport.mockResolvedValue(mockReport);

      const result = await controller.report(1, '2024-01-01', '2024-01-15');

      expect(attendanceService.getReport).toHaveBeenCalledWith(1, '2024-01-01', '2024-01-15');
      expect(result).toEqual(mockReport);
    });
  });

  describe('findOne', () => {
    it('should return an attendance record by id', async () => {
      mockAttendanceService.findOne.mockResolvedValue(mockAttendance);

      const result = await controller.findOne(1);

      expect(attendanceService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAttendance);
    });
  });

  describe('update', () => {
    it('should update an attendance record', async () => {
      const dto: UpdateAttendanceDto = { status: 'late' };
      const updatedAttendance = { ...mockAttendance, status: 'late' };
      mockAttendanceService.update.mockResolvedValue(updatedAttendance);

      const result = await controller.update(1, dto, mockUser as User);

      expect(attendanceService.update).toHaveBeenCalledWith(1, dto, mockUser.id);
      expect(result).toEqual(updatedAttendance);
    });
  });

  describe('remove', () => {
    it('should remove an attendance record', async () => {
      const expected = { message: 'Attendance record deleted successfully' };
      mockAttendanceService.remove.mockResolvedValue(expected);

      const result = await controller.remove(1);

      expect(attendanceService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });
});
