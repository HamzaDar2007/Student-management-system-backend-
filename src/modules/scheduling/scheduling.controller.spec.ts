import { Test, TestingModule } from '@nestjs/testing';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { CreateSchedulingDto } from './dto/create-scheduling.dto';
import { UpdateSchedulingDto } from './dto/update-scheduling.dto';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';

describe('SchedulingController', () => {
  let controller: SchedulingController;
  let schedulingService: jest.Mocked<SchedulingService>;

  const mockSchedule = {
    id: 1,
    courseId: 1,
    classroomId: 1,
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:30',
    createdAt: new Date(),
    updatedAt: new Date(),
    course: { id: 1, courseCode: 'CS101' },
    classroom: { id: 1, roomNumber: 'A101' },
  };

  const mockClassroom = {
    id: 1,
    roomNumber: 'A101',
    building: 'Main Building',
    capacity: 50,
    type: 'lecture',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSchedulingService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCourse: jest.fn(),
    findByClassroom: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createClassroom: jest.fn(),
    findAllClassrooms: jest.fn(),
    findOneClassroom: jest.fn(),
    updateClassroom: jest.fn(),
    removeClassroom: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulingController],
      providers: [
        {
          provide: SchedulingService,
          useValue: mockSchedulingService,
        },
      ],
    }).compile();

    controller = module.get<SchedulingController>(SchedulingController);
    schedulingService = module.get(SchedulingService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Schedule endpoints
  describe('create', () => {
    it('should create a schedule', async () => {
      const dto: CreateSchedulingDto = {
        course_id: 1,
        classroom_id: 1,
        day_of_week: 1,
        start_time: '09:00',
        end_time: '10:30',
      };
      mockSchedulingService.create.mockResolvedValue(mockSchedule);

      const result = await controller.create(dto);

      expect(schedulingService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of schedules', async () => {
      const expected = {
        items: [mockSchedule],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockSchedulingService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(1, 10);

      expect(schedulingService.findAll).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(expected);
    });

    it('should use default pagination', async () => {
      const expected = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      };
      mockSchedulingService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll();

      expect(schedulingService.findAll).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(expected);
    });
  });

  describe('findByCourse', () => {
    it('should return schedules for a course', async () => {
      const schedules = [mockSchedule];
      mockSchedulingService.findByCourse.mockResolvedValue(schedules);

      const result = await controller.findByCourse(1);

      expect(schedulingService.findByCourse).toHaveBeenCalledWith(1);
      expect(result).toEqual(schedules);
    });
  });

  describe('findOne', () => {
    it('should return a schedule by id', async () => {
      mockSchedulingService.findOne.mockResolvedValue(mockSchedule);

      const result = await controller.findOne(1);

      expect(schedulingService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('update', () => {
    it('should update a schedule', async () => {
      const dto: UpdateSchedulingDto = { start_time: '10:00' };
      const updatedSchedule = { ...mockSchedule, start_time: '10:00' };
      mockSchedulingService.update.mockResolvedValue(updatedSchedule);

      const result = await controller.update(1, dto);

      expect(schedulingService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedSchedule);
    });
  });

  describe('remove', () => {
    it('should remove a schedule', async () => {
      const expected = { message: 'Schedule deleted successfully' };
      mockSchedulingService.remove.mockResolvedValue(expected);

      const result = await controller.remove(1);

      expect(schedulingService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });

  // Classroom endpoints
  describe('createClassroom', () => {
    it('should create a classroom', async () => {
      const dto: CreateClassroomDto = {
        room_number: 'B201',
        building: 'Science Building',
        capacity: 40,
      };
      mockSchedulingService.createClassroom.mockResolvedValue(mockClassroom);

      const result = await controller.createClassroom(dto);

      expect(schedulingService.createClassroom).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockClassroom);
    });
  });

  describe('findAllClassrooms', () => {
    it('should return paginated list of classrooms', async () => {
      const expected = {
        items: [mockClassroom],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockSchedulingService.findAllClassrooms.mockResolvedValue(expected);

      const result = await controller.findAllClassrooms(1, 10);

      expect(schedulingService.findAllClassrooms).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(expected);
    });

    it('should use default pagination', async () => {
      const expected = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      };
      mockSchedulingService.findAllClassrooms.mockResolvedValue(expected);

      const result = await controller.findAllClassrooms();

      expect(schedulingService.findAllClassrooms).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(expected);
    });
  });

  describe('findOneClassroom', () => {
    it('should return a classroom by id', async () => {
      mockSchedulingService.findOneClassroom.mockResolvedValue(mockClassroom);

      const result = await controller.findOneClassroom(1);

      expect(schedulingService.findOneClassroom).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockClassroom);
    });
  });

  describe('findClassroomSchedules', () => {
    it('should return schedules for a classroom', async () => {
      const schedules = [mockSchedule];
      mockSchedulingService.findByClassroom.mockResolvedValue(schedules);

      const result = await controller.findClassroomSchedules(1);

      expect(schedulingService.findByClassroom).toHaveBeenCalledWith(1);
      expect(result).toEqual(schedules);
    });
  });

  describe('updateClassroom', () => {
    it('should update a classroom', async () => {
      const dto: UpdateClassroomDto = { capacity: 60 };
      const updatedClassroom = { ...mockClassroom, capacity: 60 };
      mockSchedulingService.updateClassroom.mockResolvedValue(updatedClassroom);

      const result = await controller.updateClassroom(1, dto);

      expect(schedulingService.updateClassroom).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedClassroom);
    });
  });

  describe('removeClassroom', () => {
    it('should remove a classroom', async () => {
      const expected = { message: 'Classroom deleted successfully' };
      mockSchedulingService.removeClassroom.mockResolvedValue(expected);

      const result = await controller.removeClassroom(1);

      expect(schedulingService.removeClassroom).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });
});
