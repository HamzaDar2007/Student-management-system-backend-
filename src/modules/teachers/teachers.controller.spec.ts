import { Test, TestingModule } from '@nestjs/testing';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { CreateTeacherProfileDto } from './dto/create-teacher-profile.dto';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto';

describe('TeachersController', () => {
  let controller: TeachersController;
  let teachersService: jest.Mocked<TeachersService>;

  const mockTeacher = {
    id: 1,
    user_id: 1,
    employee_id: 'EMP001',
    department_id: 1,
    designation: 'Professor',
    qualification: 'PhD',
    specialization: 'Computer Science',
    joining_date: new Date('2020-01-01'),
    user: {
      id: 1,
      email: 'teacher@test.com',
      first_name: 'John',
      last_name: 'Doe',
    },
  };

  const mockTeachersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeachersController],
      providers: [
        {
          provide: TeachersService,
          useValue: mockTeachersService,
        },
      ],
    }).compile();

    controller = module.get<TeachersController>(TeachersController);
    teachersService = module.get(TeachersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a teacher profile', async () => {
      const dto: CreateTeacherProfileDto = {
        user_id: 1,
        employee_id: 'EMP002',
        department_id: 1,
        designation: 'Assistant Professor',
      };
      mockTeachersService.create.mockResolvedValue(mockTeacher);

      const result = await controller.create(dto);

      expect(teachersService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTeacher);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of teachers', async () => {
      const expected = {
        items: [mockTeacher],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockTeachersService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(1, 10);

      expect(teachersService.findAll).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(expected);
    });

    it('should use default pagination', async () => {
      const expected = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      };
      mockTeachersService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll();

      expect(teachersService.findAll).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return a teacher by id', async () => {
      mockTeachersService.findOne.mockResolvedValue(mockTeacher);

      const result = await controller.findOne(1);

      expect(teachersService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTeacher);
    });
  });

  describe('findByUser', () => {
    it('should return a teacher profile by user id', async () => {
      mockTeachersService.findByUserId.mockResolvedValue(mockTeacher);

      const result = await controller.findByUser(1);

      expect(teachersService.findByUserId).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTeacher);
    });
  });

  describe('update', () => {
    it('should update a teacher profile', async () => {
      const dto: UpdateTeacherProfileDto = { designation: 'Senior Professor' };
      const updatedTeacher = { ...mockTeacher, designation: 'Senior Professor' };
      mockTeachersService.update.mockResolvedValue(updatedTeacher);

      const result = await controller.update(1, dto);

      expect(teachersService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedTeacher);
    });
  });

  describe('remove', () => {
    it('should remove a teacher profile', async () => {
      const expected = { message: 'Teacher profile deleted successfully' };
      mockTeachersService.remove.mockResolvedValue(expected);

      const result = await controller.remove(1);

      expect(teachersService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });
});
