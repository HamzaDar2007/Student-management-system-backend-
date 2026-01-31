import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { Schedule } from './entities/schedule.entity';
import { Classroom, ClassroomType } from './entities/classroom.entity';
import { Course } from '../courses/entities/course.entity';

describe('SchedulingService', () => {
  let service: SchedulingService;

  const mockSchedule = {
    id: 1,
    courseId: 1,
    classroomId: 1,
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '10:30',
    course: { id: 1, courseCode: 'CS101' },
    classroom: { id: 1, roomNumber: '101' },
  };

  const mockClassroom = {
    id: 1,
    roomNumber: '101',
    building: 'Main Building',
    capacity: 50,
    type: ClassroomType.LECTURE,
  };

  const mockCourse = { id: 1, courseCode: 'CS101' };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
    getOne: jest.fn().mockResolvedValue(null),
  };

  const mockScheduleRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    restore: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockClassroomRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    restore: jest.fn(),
  };

  const mockCourseRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingService,
        {
          provide: getRepositoryToken(Schedule),
          useValue: mockScheduleRepository,
        },
        {
          provide: getRepositoryToken(Classroom),
          useValue: mockClassroomRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: mockCourseRepository,
        },
      ],
    }).compile();

    service = module.get<SchedulingService>(SchedulingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated schedules', async () => {
      mockScheduleRepository.findAndCount.mockResolvedValue([
        [mockSchedule],
        1,
      ]);

      const result = await service.findAll(1, 10);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('total');
      expect(result.meta).toHaveProperty('page');
      expect(result.meta).toHaveProperty('limit');
    });
  });

  describe('findOne', () => {
    it('should return a schedule by id', async () => {
      mockScheduleRepository.findOne.mockResolvedValue(mockSchedule);

      const result = await service.findOne(1);

      expect(result).toEqual(mockSchedule);
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockScheduleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      course_id: 1,
      classroom_id: 1,
      day_of_week: 1,
      start_time: '09:00',
      end_time: '10:30',
    };

    it('should create a new schedule', async () => {
      mockCourseRepository.findOne.mockResolvedValue(mockCourse);
      mockClassroomRepository.findOne.mockResolvedValue(mockClassroom);
      mockScheduleRepository.find.mockResolvedValue([]);
      mockScheduleRepository.create.mockReturnValue(mockSchedule);
      mockScheduleRepository.save.mockResolvedValue(mockSchedule);

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id');
    });

    it('should throw NotFoundException if course not found', async () => {
      mockCourseRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if classroom not found', async () => {
      mockCourseRepository.findOne.mockResolvedValue(mockCourse);
      mockClassroomRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllClassrooms', () => {
    it('should return paginated classrooms', async () => {
      mockClassroomRepository.findAndCount.mockResolvedValue([
        [mockClassroom],
        1,
      ]);

      const result = await service.findAllClassrooms(1, 10);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('total');
      expect(result.meta).toHaveProperty('page');
      expect(result.meta).toHaveProperty('limit');
    });
  });

  describe('findOneClassroom', () => {
    it('should return a classroom by id', async () => {
      mockClassroomRepository.findOne.mockResolvedValue(mockClassroom);

      const result = await service.findOneClassroom(1);

      expect(result).toEqual(mockClassroom);
    });

    it('should throw NotFoundException if classroom not found', async () => {
      mockClassroomRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneClassroom(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createClassroom', () => {
    const createDto = {
      room_number: '102',
      building: 'Main Building',
      capacity: 40,
    };

    it('should create a new classroom', async () => {
      mockClassroomRepository.findOne.mockResolvedValue(null);
      mockClassroomRepository.create.mockReturnValue(mockClassroom);
      mockClassroomRepository.save.mockResolvedValue(mockClassroom);

      const result = await service.createClassroom(createDto);

      expect(result).toHaveProperty('id');
    });

    it('should throw ConflictException if room number already exists', async () => {
      mockClassroomRepository.findOne.mockResolvedValue(mockClassroom);

      await expect(service.createClassroom(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a schedule', async () => {
      mockScheduleRepository.findOne.mockResolvedValue(mockSchedule);
      mockScheduleRepository.softRemove.mockResolvedValue(mockSchedule);

      const result = await service.remove(1);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockScheduleRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeClassroom', () => {
    it('should delete a classroom', async () => {
      mockClassroomRepository.findOne.mockResolvedValue(mockClassroom);
      mockScheduleRepository.find.mockResolvedValue([]);
      mockClassroomRepository.softRemove.mockResolvedValue(mockClassroom);

      const result = await service.removeClassroom(1);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException if classroom not found', async () => {
      mockClassroomRepository.findOne.mockResolvedValue(null);

      await expect(service.removeClassroom(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if classroom has schedules', async () => {
      mockClassroomRepository.findOne.mockResolvedValue(mockClassroom);
      mockScheduleRepository.find.mockResolvedValue([mockSchedule]);

      await expect(service.removeClassroom(1)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findByCourse', () => {
    it('should return schedules for a course', async () => {
      mockScheduleRepository.find.mockResolvedValue([mockSchedule]);

      const result = await service.findByCourse(1);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toContainEqual(mockSchedule);
    });
  });

  describe('findByClassroom', () => {
    it('should return schedules for a classroom', async () => {
      mockScheduleRepository.find.mockResolvedValue([mockSchedule]);

      const result = await service.findByClassroom(1);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toContainEqual(mockSchedule);
    });
  });
});
